#include "/include/io"
#include "/include/math"
#include "/include/trace"
#include "/include/format"
void swap(int* a, int* b) {
    trace_rapid(1);
    int tmp = *a;
    *a = *b;
    *b = tmp;
    trace_rapid(0);
}
void idle(int* a, int* b) {
    trace_rapid(1);
    *a = *a;
    *b = *b;
    trace_rapid(0);
}
int main(int argc, char** argv) {
    int a[10], i, j, k, gap;
	int n = sizeof(a) / sizeof(int);
    trace_log("希尔排序");
    trace_array_1d("数组", &a, T_INT, n);
    trace_array_1d_chart("图表", &a, T_INT, n);
    trace_log("初始化数组");
    for (i = 0; i < n; i++)
        a[i] = rand() % 89 + 10;
    for (gap = n / 2, k = 1; gap > 0; gap /= 2, k++) {
        char* f = format("第%d趟排序，增量为%d", k, gap);
        trace_log(f);
        free(f);
        for (i = gap; i < n; i++) {
            idle(&(a[i - gap]), &(a[i]));
            for (j = i; j >= gap && a[j - gap] > a[j]; j -= gap)
                swap(&(a[j - gap]), &(a[j]));
        }
    }
    trace_end("数组");
    trace_end("图表");
}