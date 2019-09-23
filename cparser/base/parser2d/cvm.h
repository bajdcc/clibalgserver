﻿//
// Project: CMiniLang
// Author: bajdcc
//

#ifndef CMINILANG_VM_H
#define CMINILANG_VM_H

#include <memory>
#include <vector>
#include <unordered_set>
#include <chrono>
#include <array>
#include <deque>
#include "types.h"
#include "memory.h"
#include "cmem.h"
#include "cvfs.h"

namespace clib {

    // Website: https://github.com/bajdcc/MiniOS

    /* virtual memory management */
    // 虚存分配（二级页表分配方式）

    // 参考：http://wiki.osdev.org/Paging

    // 对于一个32位虚拟地址（virtual address）
    // 32-22: 页目录号 | 21-12: 页表号 | 11-0: 页内偏移
    // http://www.360doc.com/content/11/0804/10/7204565_137844381.shtml

    /* 4k per page */
#define PAGE_SIZE 4096

/* 页掩码，取高20位 */
#define PAGE_MASK 0xfffff000

/* 地址对齐 */
#define PAGE_ALIGN_DOWN(x) ((x) & PAGE_MASK)
#define PAGE_ALIGN_UP(x) (((x) + PAGE_SIZE - 1) & PAGE_MASK)

/* 分析地址 */
#define PAGE_INDEX(x)   ((x) & 0xfffff000)       // 获得页表号
#define OFFSET_INDEX(x) ((x) & 0x00000fff)       // 获得页内偏移

/* 用户代码段基址 */
#define USER_BASE 0xc0000000
/* 用户数据段基址 */
#define DATA_BASE 0xd0000000
/* 用户栈基址 */
#define STACK_BASE 0xe0000000
/* 用户堆基址 */
#define HEAP_BASE 0xf0000000
/* 段掩码 */
#define SEGMENT_MASK 0x0fffffff

#define PE_MAGIC "ccos"

#define TASK_NUM 65536
#define HANDLE_NUM 65536
#define BIG_DATA_NUM 512

#define LOG_VM 1

    class cgui;
    class cvm : public imem, public vfs_func_t, public vfs_stream_call {
    public:
        cvm();
        ~cvm();

        cvm(const cvm&) = delete;
        cvm& operator=(const cvm&) = delete;

        void set_gui(cgui* gui);

        int load(const string_t& path, const std::vector<byte>& file, const std::vector<string_t>& args);
        bool run(int cycle, int& cycles);

        void map_page(uint32_t addr, uint32_t id) override;
        void as_root(bool flag);
        bool exist_vfs(const string_t& path) const;
        bool read_vfs(const string_t& path, std::vector<byte>& data) const;
        bool write_vfs(const string_t& path, const std::vector<byte>& data);

        vfs_stream_t stream_type(const string_t& path) const override;
        string_t stream_callback(const string_t& path) override;
        vfs_node_dec* stream_create(const vfs_mod_query* mod, vfs_stream_t type, const string_t& path) override;
        int stream_index(vfs_stream_t type) override;
        string_t stream_net(vfs_stream_t type, const string_t& path, bool& post, string_t& postfield, bool& bin) override;
        int stream_write(vfs_stream_t type, byte c) override;
        bool stream_path(const string_t& path, std::vector<byte>& data) override;

        void reset_ips();

        static void logging(CString s);

    private:
        // 申请页框
        uint32_t pmm_alloc();
        // 初始化页表
        void vmm_init();
        // 虚页映射
        void vmm_map(uint32_t va, uint32_t pa);
        // 解除映射
        void vmm_unmap(uint32_t va);
        // 查询分页情况
        int vmm_ismap(uint32_t va, uint32_t* pa) const;

        template<class T = int>
        T vmm_get(uint32_t va) const;
        template<class T = int>
        bool vmm_valid(uint32_t va) const;
        string_t vmm_getstr(uint32_t va) const;
        void vmm_getmem(uint32_t va, int len, std::vector<byte>& data) const;
        void vmm_setmem(uint32_t va, int len, const std::vector<byte>& data);
        template<class T = int>
        T vmm_set(uint32_t va, T);
        void vmm_setstr(uint32_t va, const string_t& str);
        uint32_t vmm_malloc(uint32_t size);
        uint32_t vmm_free(uint32_t addr);
        uint32_t vmm_memset(uint32_t va, uint32_t value, uint32_t count);
        uint32_t vmm_memcmp(uint32_t src, uint32_t dst, uint32_t count);
        template<class T = int>
        void vmm_pushstack(uint32_t & sp, T value);
        template<class T = int>
        T vmm_popstack(uint32_t & sp);

        string_t source() const;
        string_t source(uint pc) const;
        string_t get_func_info(int pc) const;
        void error(const string_t&) const;
        void exec(int cycle, int& cycles);
        void destroy(int id);
        int exec_file(const string_t& path);
        int fork();

        string_t get_stacktrace() const;

        char* output_fmt(char* buf, int id) const;
        int output(int id);
        bool interrupt();
        bool math(int id);
        void cast();

        void init_fs();
        void init_global();

        enum handle_type {
            h_none,
            h_file,
            h__end,
        };

        int new_pid();
        int new_handle(handle_type);
        string_t handle_typename(handle_type) const;
        void destroy_handle(int handle);

        void reset();

    private:
        int pids{ 0 };

        enum ctx_flag_t {
            CTX_VALID = 1 << 0,
            CTX_KERNEL = 1 << 1,
            CTX_USER_MODE = 1 << 2,
            CTX_FOREGROUND = 1 << 3,
            CTX_SERVICE = 1 << 4,
            CTX_INPUT = 1 << 5,
        };

        enum ctx_state_t {
            CTS_RUNNING,
            CTS_WAIT,
            CTS_ZOMBIE,
            CTS_DEAD,
        };

        static const char* state_string(ctx_state_t);

        struct context_t {
            uint flag{ 0 };
            int id{ -1 };
            int parent{ -1 };
            std::unordered_set<int> child;
            std::list<int> exited_child;
            ctx_state_t state{ CTS_DEAD };
            string_t path;
            uint mask{ 0 };
            uint entry{ 0 };
            uint poolsize{ 0 };
            uint stack{ 0 };
            uint data{ 0 };
            uint base{ 0 };
            uint heap{ 0 };
            uint pc{ 0 };
            uint64 ips{ 0ULL };
            uint64 ips_disp{ 0ULL };
            union {
                int _i;
                uint _ui;
                void* _p;
                float _f;
                double _d;
                int64 _q;
                uint64 _uq;
                struct {
                    int _1, _2;
                } _u;
                short _s;
                uint16_t _us;
                char _c;
                byte big_data[BIG_DATA_NUM];
            } ax{ 0 };
            uint bp{ 0 };
            uint sp{ 0 };
            bool debug{ false };
            std::vector<byte> file;
            std::vector<uint32_t> allocation;
            std::vector<uint32_t> data_mem;
            std::vector<uint32_t> text_mem;
            std::vector<uint32_t> stack_mem;
            std::vector<uint32_t> stacktrace;
            std::vector<uint32_t> stacktrace_pc;
            std::vector<uint32_t> stacktrace_pc2;
            std::unordered_map<uint32_t, string_t> stacktrace_dbg;
            std::unique_ptr<cmem> pool;
            std::queue<uint16_t> sigs;
            std::vector<std::vector<byte>> pages;
            std::unordered_map<uint32, uint32> pgdir;
            // SYSTEM CALL
            std::chrono::system_clock::time_point record_now;
            decimal waiting_ms{ 0 };
            int input_redirect{ 0 };
            int output_redirect{ 0 };
            bool input_stop{ false };
            std::deque<char> input_queue;
            std::unordered_set<int> handles;
            std::vector<string_t> paths;
            string_t cmd;
        };
        context_t* ctx{ nullptr };
        int available_tasks{ 0 };
        std::array< std::unique_ptr<context_t>, TASK_NUM> tasks;
        cvfs fs;
        cgui* gui;

        struct handle_t {
            handle_type type{ h_none };
            int refs{ 0 };
            string_t name;
            union {
                vfs_node_dec* file{ nullptr };
            } data;
        };
        int handle_ids{ 0 };
        int available_handles{ 0 };
        int set_cycle_id{ -1 };
        std::unordered_set<int> set_resize_id;
        std::array<std::unique_ptr<handle_t>, HANDLE_NUM> handles;

    public:
        static struct global_state_t {
            bool interrupt{ false };
            int input_lock{ -1 };
            std::vector<int> input_waiting_list;
            std::string input_content;
            bool input_success{ false };
            int input_read_ptr{ -1 };
            int input_code{ 0 };
            bool input_single{ false };
            string_t hostname{ "ccos" };
            bool gui{ false };
            decltype(std::chrono::system_clock::now()) now;
#if LOG_VM
            std::vector<string_t> log_info, log_err;
#endif
            std::list<CString> logging;
            bool is_logging{ false };
        } global_state;
    };
}

#endif //CMINILANG_VM_H
