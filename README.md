# clibalgserver

参见：[【算法可视化计划】启程](https://zhuanlan.zhihu.com/p/83573660)

实现一个算法可视化网站。

## 介绍

算法用C语言实现，通过后端处理将C代码编译成可视化步骤。

## 调试接口

```cpp
// 控制台输出
void trace_log(char* text) {
    text;
    interrupt 305;
}
// 追踪单个变量
void trace_var(char* name, void* arr, int type);
// 追踪一维数组
void trace_array_1d(char* name, void* arr, int type, int cols);
// 追踪二维数组
void trace_array_2d(char* name, void* arr, int type, int rows, int cols);
// 取消追踪
void trace_end(char* name);
```

## 知乎文章列表

- [​【算法可视化计划】启程](https://zhuanlan.zhihu.com/p/83573660)
- [​【算法可视化计划】虚拟系统](https://zhuanlan.zhihu.com/p/83863115)
- [【算法可视化计划】变量跟踪](https://zhuanlan.zhihu.com/p/84017677)

## 截图

![main](https://raw.githubusercontent.com/bajdcc/clibalgserver/master/screenshots/1.png)

![main](https://raw.githubusercontent.com/bajdcc/clibalgserver/master/screenshots/2.png)

![main](https://raw.githubusercontent.com/bajdcc/clibalgserver/master/screenshots/3.png)

![main](https://raw.githubusercontent.com/bajdcc/clibalgserver/master/screenshots/4.png)