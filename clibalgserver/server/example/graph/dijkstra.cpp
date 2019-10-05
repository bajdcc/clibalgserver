#include "/include/io"
#include "/include/math"
#include "/include/trace"
#include "/include/format"
int L;
int pt(int x, int y) {
    return x * L + y;
}
char* sname(int n) {
    char** ptr = malloc(n * sizeof(char*));
    char** ret = ptr;
    char* str = malloc(n * 2 * sizeof(char));
    int i;
    char* p = str;
    for (i = 0; i < n; i++) {
        *ptr++ = p;
        *p++ = (char)('A' + i);
        *p++ = '\0';
    }
    return ret;
}
int INF = 999;
int main(int argc, char** argv) {
    int n = 8, i, j;
    L = n;
    char* name = sname(n);
    int* adj = malloc(n * n);
    trace_log("Dijkstra最短路径");
    trace_array_2d("邻接矩阵", adj, T_INT, n, n);
    trace_graph("图", name, adj, INF, T_INT, n);
    trace_log("初始化");
    for (i = 0; i < n; i++) {
        trace_rapid(1);
        for (j = i + 1; j < n; j++) {
            if (rand() % 3 == 0)
                adj[pt(i, j)] = adj[pt(j, i)] = rand() % n + 1;
            else
                adj[pt(i, j)] = adj[pt(j, i)] = INF;
        }
        trace_rapid(0);
    }
}