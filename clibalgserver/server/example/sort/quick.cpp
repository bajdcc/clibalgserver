#include "/include/io"
#include "/include/math"
#include "/include/trace"
#include "/include/xtoa_itoa"
#include "/include/format"
void output(char* text) {
    trace_log(text);
    free(text);
}
void swap(int* a, int* b) {
    trace_rapid(1);
    int tmp = *a;
    *a = *b;
    *b = tmp;
    trace_rapid(0);
}
int idle(int* a, int* b) {
    trace_rapid(1);
    *a = *a;
    *b = *b;
    trace_rapid(0);
    return 1;
}
void select(int* arr, int left, int right) {
    trace_rapid(1);
    int i;
    for (i = left; i <= right; i++) {
        arr[i] = arr[i];
    }
    trace_rapid(0);
}
int partition(int* arr, int left, int right) {
    int i = left + 1;
    int j = right;
    int temp = arr[left];
    while (i <= j) {
        while (i <= j && idle(&(arr[i]), &(arr[left])) > 0 && arr[i] < temp) i++;
        while (i <= j && idle(&(arr[j]), &(arr[left])) > 0 && arr[j] > temp) j--;
        if (i < j)
            swap(&(arr[i++]), &(arr[j--]));
        else {
            i++;
            idle(&(arr[i]), &(arr[j]));
        }
    }
    swap(&(arr[j]), &(arr[left]));
    return j;
}
void quick_sort(int* arr, int left, int right) 
{
    output(format("快排 [%d,%d]", left, right));
    select(arr, left, right);
    if (left > right)
        return;
    int j = partition(arr, left, right);
    output(format("分组 [%d,%d] => [%d,%d] + [%d,%d]", left, right, left, j - 1, j + 1, right));
    quick_sort(arr, left, j - 1);
    quick_sort(arr, j + 1, right);
}
int main(int argc, char** argv) {
    int a[10], i, j;
	int n = sizeof(a) / sizeof(int);
    trace_log("快速排序");
    trace_array_1d("数组", &a, T_INT, n);
    trace_array_1d_chart("图表", &a, T_INT, n);
    trace_log("初始化数组");
    for (i = 0; i < n; i++)
        a[i] = rand() % 89 + 10;
    quick_sort(&a, 0, n - 1);
    trace_end("数组");
    trace_end("图表");
}