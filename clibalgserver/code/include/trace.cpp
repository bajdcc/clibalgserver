//
// Project: clibparser
// Created by bajdcc
//

// 控制台输出
void trace_log(char* text) {
    text;
    interrupt 305;
}

// 支持的追踪类型
enum trace_type {
    T_CHAR,
    T_INT,
};

struct __trace_var__ {
    char* name;
    void* arr;
    int type;
};

// 追踪单个变量
void trace_var(char* name, void* arr, int type) {
    __trace_var__ s;
    s.name = name;
    s.arr = arr;
    s.type = type;
    &s;
    interrupt 301;
}

struct __trace_1d__ {
    __trace_var__ v;
    int cols;
};

// 追踪一维数组
void trace_array_1d(char* name, void* arr, int type, int cols) {
    __trace_1d__ s;
    s.v.name = name;
    s.v.arr = arr;
    s.v.type = type;
    s.cols = cols;
    &s;
    interrupt 302;
}

struct __trace_2d__ {
    __trace_var__ v;
    int rows, cols;
};

// 追踪二维数组
void trace_array_2d(char* name, void* arr, int type, int rows, int cols) {
    __trace_2d__ s;
    s.v.name = name;
    s.v.arr = arr;
    s.v.type = type;
    s.rows = rows;
    s.cols = cols;
    &s;
    interrupt 303;
}

// 取消追踪
void trace_end(char* name) {
    name;
    interrupt 304;
}