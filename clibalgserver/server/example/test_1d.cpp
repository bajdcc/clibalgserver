#include "/include/io"
#include "/include/math"
#include "/include/trace"
void swap(int* a, int* b) {
    int t = *a;
    *a = *b;
    *b = t;
}
int main(int argc, char** argv) {
    int a[10], i, j;
	int n = sizeof(a) / sizeof(int);
    trace_array_1d("a", &a, T_INT, n);
    for (i = 0; i < n; i++)
        a[i] = rand() % 9 + 1;
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - i - 1; j++)
            if (a[j] > a[j + 1])
                swap(&(a[j]), &(a[j + 1]));
    trace_end("a");
}