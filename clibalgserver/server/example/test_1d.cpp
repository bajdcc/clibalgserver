#include "/include/io"
#include "/include/math"
#include "/include/trace"
int tmp;
void swap(int* a, int* b) {
    tmp = *a;
    *a = *b;
    *b = tmp;
}
int main(int argc, char** argv) {
    int a[10], i, j;
	int n = sizeof(a) / sizeof(int);
    trace_log("一维数组修改示例");
    trace_var("临时变量", &tmp, T_INT);
    trace_array_1d("数组", &a, T_INT, n);
    for (i = 0; i < n; i++)
        a[i] = rand() % 9 + 1;
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - i - 1; j++)
            if (a[j] > a[j + 1])
                swap(&(a[j]), &(a[j + 1]));
    trace_end("数组");
    trace_end("临时变量");
}