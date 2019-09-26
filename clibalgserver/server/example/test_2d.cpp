#include "/include/io"
#include "/include/math"
#include "/include/trace"
int main(int argc, char** argv) {
    int a[3][4], i;
	int n = sizeof(a) / sizeof(int);
    trace_log("二维数组修改示例");
    trace_array_2d("数组", &a, T_INT, 3, 4);
    for (i = 0; i < n; i++)
        ((int*)&a)[i] = i;
    trace_end("数组");
}