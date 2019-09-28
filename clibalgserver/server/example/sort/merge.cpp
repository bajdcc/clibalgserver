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
void merge(int* arr, int* tmp, int left, int mid, int right) {
    int i = left, j = mid + 1, k, p = left;
    while(i <= mid && j <= right) {
        idle(&(arr[i]), &(arr[j]));
        if (arr[i] > arr[j]) {
            tmp[p++] = arr[j++];
        } else {
            tmp[p++] = arr[i++];
        }
    }
    while(i <= mid) tmp[p++] = arr[i++];
    while(j <= right) tmp[p++] = arr[j++];
    for (k = left; k < p; k++)
        arr[k] = tmp[k];
}
void merge_sort(int* arr, int* tmp, int left, int right) {
    if (left >= right)
        return;
    int mid = (left + right) / 2;
    output(format("归并 [%d,%d] => [%d,%d] + [%d,%d]", left, right, left, mid, mid + 1, right));
    select(arr, left, right);
    merge_sort(arr, tmp, left, mid);
    merge_sort(arr, tmp, mid + 1, right);
    merge(arr, tmp, left, mid, right);
}
int main(int argc, char** argv) {
    int a[10], i, j;
	int n = sizeof(a) / sizeof(int);
    int* tmp = malloc(sizeof(a));
    trace_log("归并排序");
    trace_array_1d_chart("数组", &a, T_INT, n);
    trace_array_1d_chart("临时", tmp, T_INT, n);
    trace_log("初始化数组");
    for (i = 0; i < n; i++)
        a[i] = rand() % 89 + 10;
    merge_sort(&a, tmp, 0, n - 1);
    trace_end("数组");
    trace_end("临时");
    free(tmp);
}