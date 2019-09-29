#include "/include/io"
#include "/include/math"
#include "/include/format"
#include "/include/trace"
void output(char* text) {
    trace_log(text);
    free(text);
}
void select(char* s, int n) {
    trace_rapid(1);
    int i;
    for (i = 0; i < n; i++) {
        s[i] = s[i];
    }
    trace_rapid(0);
}
void select_(int* arr, int na, int nb) {
    trace_rapid(1);
    int i;
    for (i = 0; i < na; i++) {
        arr[i * nb] = arr[i * nb];
    }
    for (i = 1; i < nb; i++) {
        arr[i] = arr[i];
    }
    trace_rapid(0);
}
void idle_(char* a) {
    *a = *a;
}
void idle(char* a, char* b) {
    trace_rapid(1);
    *a = *a;
    *b = *b;
    trace_rapid(0);
}
int max(int a, int b) {
    return a > b ? a : b;
}
int main(int argc, char** argv) {
    int i, j;
    char* a = "BDCABA"; int na = strlen(a) + 1;
    char* b = "ABCBDAB";int nb = strlen(b) + 1;
    int* dp = malloc(na * nb * sizeof(int));
    memset(dp, 0, na * nb * sizeof(int));
    trace_log("最长公共子序列");
    trace_array_1d("串A", a, T_CHAR, na - 1);
    trace_array_1d("串B", b, T_CHAR, nb - 1);
    trace_array_2d("DP", dp, T_INT, na, nb);
    select(a, na - 1);
    select(b, nb - 1);
    select_(dp, na, nb);
    for (i = 1; i < na; i++) {
        for (j = 1; j < nb; j++)  {
            idle(&(a[i - 1]), &(b[j - 1]));
            if (a[i - 1] == b[j - 1]) {
                idle_(&(dp[(i-1) * nb + j-1]));
                dp[i * nb + j] = dp[(i-1) * nb + j-1]+1;
            }
            else {
                idle(&(dp[(i-1) * nb + j]), &(dp[(i) * nb + j-1]));
                dp[i * nb + j] = max(dp[(i-1) * nb + j], dp[(i) * nb + j-1]);
            }
        }
    }
    output(format("答案为：%d", dp[na * nb - 1]));
    trace_end("串A");
    trace_end("串B");
    trace_end("DP");
    free(dp);
}