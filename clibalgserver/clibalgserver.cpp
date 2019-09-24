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
#include <mime.h>

#define SERVER_NAME "clibalgserver"
#define WWW_ROOT "./server"

std::unordered_map<std::string, std::vector<byte>> www;
std::vector<std::string> def_index = {
    "index.html",
    "index.htm",
};

std::string gmt_now;
void init_time() {
    using namespace std::chrono;
    using namespace std::literals::chrono_literals;
    auto time_now = system_clock::to_time_t(system_clock::now());
    tm _t;
    gmtime_s(&_t, &time_now);
    std::stringstream ss;
    ss << std::put_time(&_t, "%a, %d %b %Y %H:%M:%S %Z");
    gmt_now = ss.str();
}

int handle_static(struct evhttp_request* req, const char* url, evbuffer* buf)
{
    std::string U(url);
    if (U.empty())
        return HTTP_NOTFOUND;
    if (U.back() == '/') {
        for (auto& idx : def_index) {
            auto f = www.find(U + idx);
            if (f != www.end()) {
                evhttp_add_header(evhttp_request_get_output_headers(req), "Location", (U + idx).c_str());
                return HTTP_MOVETEMP;
            }
        }
    }

    auto f = www.find(U);
    if (f == www.end())
        return HTTP_NOTFOUND;

    auto since = evhttp_find_header(evhttp_request_get_input_headers(req), "If-Modified-Since");
    if (since) {
        evhttp_add_header(evhttp_request_get_output_headers(req), "Cache-Control", "max-age=120");
        return HTTP_NOTMODIFIED;
    }
    else {
        evbuffer_add(buf, (const char*)f->second.data(), f->second.size());
        evhttp_add_header(evhttp_request_get_output_headers(req), "Cache-Control", "max-age=120");
        evhttp_add_header(evhttp_request_get_output_headers(req), "Last-Modified", gmt_now.c_str());
        return HTTP_OK;
    }

}

int handle_api_compile(const char* url, evbuffer* buf, char* data, size_t len)
{
    using namespace rapidjson;

    Document d;

    if (d.Parse(data).HasParseError())
    {
        evbuffer_add_printf(buf, R"(Parse Error(offset %u): %s)",
            (unsigned)d.GetErrorOffset(),
            GetParseError_En(d.GetParseError()));
        return HTTP_BADREQUEST;
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
            return HTTP_OK;
        }
        else {
            evbuffer_add_printf(buf, "{Need string}");
        }
    }
    else {
        evbuffer_add_printf(buf, "{Need text}");
    }
    return HTTP_BADREQUEST;
}

const char* code2str(int code)
{
    switch (code)
    {
    case HTTP_OK: return "OK";
    case HTTP_NOCONTENT: return "No Content";
    case HTTP_MOVEPERM: return "Moved Permanently";
    case HTTP_MOVETEMP: return "Found";
    case HTTP_NOTMODIFIED: return "Not Modified";
    case HTTP_BADREQUEST: return "Bad Request";
    case HTTP_NOTFOUND: return "Not Found";
    case HTTP_BADMETHOD: return "Method Not Allowed";
    case HTTP_ENTITYTOOLARGE: return "Request Entity Too Large";
    case HTTP_EXPECTATIONFAILED: return "Expectation Failed";
    case HTTP_INTERNAL: return "Internal Server Error";
    case HTTP_NOTIMPLEMENTED: return "Not Implemented";
    case HTTP_SERVUNAVAIL: return "Service Unavailable";
    default:
        break;
    }
    return "Not Implemented";
}

const char* method2str(int code)
{
    switch (code)
    {
    case EVHTTP_REQ_GET: return "GET";
    case EVHTTP_REQ_POST: return "POST";
    case EVHTTP_REQ_HEAD: return "HEAD";
    case EVHTTP_REQ_PUT: return "PUT";
    case EVHTTP_REQ_DELETE: return "DELETE";
    case EVHTTP_REQ_OPTIONS: return "OPTIONS";
    case EVHTTP_REQ_TRACE: return "TRACE";
    case EVHTTP_REQ_CONNECT: return "CONNECT";
    case EVHTTP_REQ_PATCH: return "PATCH";
    default:
        break;
    }
    return "UNKNOWN";
}

void generic_handler(struct evhttp_request* req, void* arg)
{
    auto buf = evbuffer_new();
    if (!buf)
    {
        printf("Failed to create response buffer.\n");
        return;
    }

    using namespace std::chrono;
    using namespace std::literals::chrono_literals;
    auto now = system_clock::now();

    int suc = HTTP_OK;
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
        suc = handle_static(req, url, buf);
    }
    else if (cmd == EVHTTP_REQ_POST) {
        evhttp_request_get_command(req);
        auto input = evhttp_request_get_input_buffer(req);
        auto post_size = evbuffer_get_length(input);
        if (post_size <= 0)
        {
            evbuffer_add_printf(buf, R"(Empty postdata)");
            suc = HTTP_BADREQUEST;
        }
        else
        {
            suc = HTTP_BADREQUEST;
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
    else if (cmd == EVHTTP_REQ_HEAD) {

    }
    else {
        printf("Unsupported Method %s\n", url);
        evbuffer_add_printf(buf, "Hello world.<br> URL: %s\n", url);
    }
    evhttp_add_header(evhttp_request_get_output_headers(req), "Server", SERVER_NAME);
    std::string U(url);
    std::string ext;
    auto idx = U.find_last_of('.');
    if (idx != std::string::npos)
        ext = U.substr(U.find_last_of('.') + 1);
    evhttp_add_header(evhttp_request_get_output_headers(req), "Content-Type", clib::get_mime_from_ext(ext).c_str());
    auto dt = duration_cast<milliseconds>(system_clock::now() - now).count();
    printf("%s %s %d %d %lldms\n", method2str(cmd), url, suc, evbuffer_get_length(buf), dt);
    evhttp_send_reply(req, suc, code2str(suc), buf);
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
    init_time();
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