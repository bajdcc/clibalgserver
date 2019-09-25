#include "/include/io"
#include "/include/math"
#include "/include/trace"
int main(int argc, char** argv) {
    int a[3][4], i;
	int n = sizeof(a) / sizeof(int);
    trace_array_2d("a", &a, T_INT, 3, 4);
    for (i = 0; i < n; i++)
        ((int*)&a)[i] = i;
    trace_end("a");
}