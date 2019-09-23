// clibalgserver.cpp : 此文件包含 "main" 函数。程序执行将在此处开始并结束。
//

#include "stdafx.h"
#include <event2\http.h>
#include <event2\buffer.h>
#include <rapidjson/document.h>
#include <rapidjson/writer.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/error/en.h>
#include "../cparser/parser.h"

#define SERVER_NAME "clibalgserver"
#define WWW_ROOT "./server"

std::unordered_map<std::string, std::vector<byte>> www;

bool handle_static(const char* url, evbuffer* buf)
{
    auto f = www.find(url);
    if (f == www.end())
        return false;

    evbuffer_add(buf, (const char *)f->second.data(), f->second.size());
    return true;
}

bool handle_api_compile(const char* url, evbuffer* buf, char* data, size_t len)
{
    using namespace rapidjson;

    Document d;

    if (d.Parse(data).HasParseError())
    {
        evbuffer_add_printf(buf, R"(Parse Error(offset %u): %s)",
            (unsigned)d.GetErrorOffset(),
            GetParseError_En(d.GetParseError()));
        return false;
    }

    auto text = d.FindMember("text");
    if (text != d.MemberEnd())
    {
        Value& s = d["text"];
        if (s.IsString()) {
            auto str = std::string(s.GetString());
            decltype(str) out;

            auto ret = clib::parser(str, out);
            
            Document r;
            r.SetObject();
            if (ret != clib::P_OK) {
                r.AddMember("code", Value(400), r.GetAllocator());
            }
            else {
                r.AddMember("code", Value(200), r.GetAllocator());
                r.AddMember("text", Value(out.c_str(), r.GetAllocator()), r.GetAllocator());
            }

            StringBuffer buffer;
            Writer<StringBuffer> writer(buffer);
            r.Accept(writer);

            evbuffer_add_printf(buf, buffer.GetString());
            return true;
        }
        else {
            evbuffer_add_printf(buf, "{Need string}");
        }
    }
    else {
        evbuffer_add_printf(buf, "{Need text}");
    }
    return false;
}

void generic_handler(struct evhttp_request* req, void* arg)
{
    auto buf = evbuffer_new();
    if (!buf)
    {
        printf("Failed to create response buffer.\n");
        return;
    }

    auto suc = true;
    auto u = evhttp_request_get_uri(req);
    auto uri = evhttp_uri_parse(u);
    if (!uri)
    {
        printf("Failed to parse uri.\n");
        return;
    }
    auto url = evhttp_uri_get_path(uri);
    auto cmd = evhttp_request_get_command(req);
    if (cmd == EVHTTP_REQ_GET) {
        printf("GET %s\n", url);
        suc = handle_static(url, buf);
    }
    else if (cmd == EVHTTP_REQ_POST) {
        printf("POST %s\n", url);
        evhttp_request_get_command(req);
        auto input = evhttp_request_get_input_buffer(req);
        auto post_size = evbuffer_get_length(input);
        if (post_size <= 0)
        {
            evbuffer_add_printf(buf, R"(Empty postdata)");
            suc = false;
        }
        else
        {
            suc = false;
            auto b = (char*)malloc(post_size + 1);
            if (!b) {
                evbuffer_add_printf(buf, R"(Malloc failed)");
            }
            else {
                CopyMemory(b, evbuffer_pullup(input, -1), post_size);
                b[post_size] = 0;
                if (strncmp(url, "/api", 4) == 0)
                {
                    if (strcmp(url + 4, "/compile") == 0)
                        suc = handle_api_compile(url, buf, b, post_size);
                    else
                        evbuffer_add_printf(buf, R"(Invalid API)", b);
                }
                else
                    evbuffer_add_printf(buf, R"(Invalid API)", b);
                free(b);
            }
        }
    }
    else {
        printf("Unsupported Method %s\n", url);
        evbuffer_add_printf(buf, "Hello world.<br> URL: %s\n", url);
    }
    evhttp_add_header(evhttp_request_get_output_headers(req), "Server", SERVER_NAME);
    if (suc)
        evhttp_send_reply(req, HTTP_OK, "OK", buf);
    else
        evhttp_send_reply(req, HTTP_BADREQUEST, "Bad Request", buf);
    evbuffer_free(buf);
}

void load_bin(const std::string& path)
{
    std::ifstream t(WWW_ROOT + path, std::ifstream::binary);
    if (t) {
        auto p = t.rdbuf();
        auto size = p->pubseekoff(0, std::ios::end, std::ios::in);
        p->pubseekpos(0, std::ios::in);
        std::vector<byte> data((size_t)size);
        p->sgetn((char*)data.data(), size);
        www.insert(std::make_pair(path, data));
    }
}

void load_dir_rec(const std::string& path)
{
    WIN32_FIND_DATAA FindFileData;
    auto p = WWW_ROOT + path + "/*";
    auto hListFile = FindFirstFileA(p.c_str(), &FindFileData);
    if (hListFile == INVALID_HANDLE_VALUE)
        return;
    else
    {
        do
        {
            auto name = std::string(FindFileData.cFileName);
            if (name == "." || name == "..")
                continue;
            if (FindFileData.dwFileAttributes & FILE_ATTRIBUTE_ENCRYPTED)
                continue;
            if (FindFileData.dwFileAttributes & FILE_ATTRIBUTE_HIDDEN)
                continue;
            if (FindFileData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)
                load_dir_rec(path + "/" + name);
            else
            {
                load_bin(path + "/" + name);
            }
        } while (FindNextFileA(hListFile, &FindFileData));
        FindClose(hListFile);
    }
}

void load_dir(const std::string& path)
{
    load_dir_rec(path);
}

int main()
{
    load_dir("");

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
    {
        printf("WSA failed.\n");
        return -1;
    }

    auto httpd_option_listen = "0.0.0.0";
    auto httpd_option_port = 8080;

    struct event_base* base = event_base_new();

    struct evhttp* http_server = evhttp_new(base);
    if (!http_server)
    {
        printf("Init failed.\n");
        return -1;
    }

    int ret = evhttp_bind_socket(http_server, httpd_option_listen, httpd_option_port);
    if (ret != 0)
    {
        printf("Bind failed.\n");
        return -1;
    }

    evhttp_set_gencb(http_server, generic_handler, NULL);

    printf("Listen on 8080.\n");

    event_base_dispatch(base);

    evhttp_free(http_server);

    WSACleanup();
}