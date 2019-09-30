#include "/include/io"
#include "/include/trace"
#include "/include/format"
int L;
int pt(int x, int y) {
    return x * L + y;
}
void output(char* text) {
    trace_log(text);
    free(text);
}
int dir[0] = {0, 1, 0, -1, 1, 0, -1, 0};
int suc = 0;
int a[20],b[40],c[40];//ai是竖列，b、c 是对角线
int dfs(char* map, int n, int k) {
    if (n == k - 1) {
        ++suc;
        output(format("发现第%d个解", suc));
        trace_delay(1);
        return 1;
    }
    int i;
    for (i = 0; i < n; i++){
        if (a[i]) continue;
        if (b[i-k+n]) continue;
        if (c[i+k-1]) continue;
        a[i] = b[i-k+n] = c[i+k-1] = 1;
        map[pt(k - 1, i)] = 'O';
        dfs(map, n, k+1);
        map[pt(k - 1, i)] = ' ';
        a[i] = b[i-k+n] = c[i+k-1] = 0;
    }
    return 0;
}
int main(int argc, char** argv) {
    int n = 8, i, j;
    L = n;
    char* map = malloc(n * n * sizeof(char));
    output(format("%d皇后问题", n));
    trace_array_2d("棋盘", map, T_CHAR, n, n);
    trace_log("初始化棋盘");
    for (i = 0; i < n; i++) {
        trace_rapid(1);
        for (j = 0; j < n; j++)
            map[pt(i, j)] = ' ';
        trace_rapid(0);
    }
    dfs(map, n, 1);
    if (suc > 0) 
        trace_log("成功");
    else
        trace_log("失败");
    trace_end("棋盘");
}