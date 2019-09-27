#include "/include/io"
#include "/include/math"
#include "/include/trace"
#include "/include/xtoa_itoa"
#include "/include/format"
void swap(int* a, int* b) {
    trace_rapid(1);
    int tmp = *a;
    *a = *b;
    *b = tmp;
    trace_rapid(0);
}
void idle(int* a, int* b, int* c) {
    trace_rapid(1);
    *a = *a;
    *b = *b;
    *c = *c;
    trace_rapid(0);
}
int main(int argc, char** argv) {
    int a[10], i, j;
	int n = sizeof(a) / sizeof(int);
    trace_log("选择排序");
    trace_array_1d("数组", &a, T_INT, n);
    trace_array_1d_chart("图表", &a, T_INT, n);
    trace_log("初始化数组");
    for (i = 0; i < n; i++)
        a[i] = rand() % 89 + 10;
    for (i = 0; i < n - 1; i++) {
        char* f = format("第%d趟排序", i + 1);
        trace_log(f);
        free(f);
        int min_idx = i;
        for (j = i + 1; j < n; j++){
            idle(&(a[i]), &(a[j]), &(a[min_idx]));
            if (a[j] < a[min_idx])
                min_idx = j;
        }
        swap(&(a[i]), &(a[min_idx]));
    }
    trace_end("数组");
    trace_end("图表");
}