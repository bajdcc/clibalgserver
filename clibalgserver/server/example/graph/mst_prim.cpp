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
    int n = 8, i, j, k, start = 0;
    L = n;
    char* name = sname(n);
    int* adj = malloc(n * n * sizeof(int));
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
    int* visited = malloc(n * sizeof(int));
    trace_array_1d("访问", visited, T_INT, n);
    trace_rapid(1);
    for (i = 0; i < n; i++) {
        visited[i] = 0;
    }
    trace_rapid(0);
    int* dist = malloc(n * sizeof(int));
    trace_array_1d("连通距离", dist, T_INT, n);
    trace_rapid(1);
    for (i = 0; i < n; i++) {
        dist[i] = adj[pt(start, i)];
    }
    trace_rapid(0);
    int* mst = malloc(2 * n * sizeof(int));
    trace_array_2d("最小生成树", mst, T_INT, n - 1, 2);
    trace_rapid(1);
    for (i = 0; i < n; i++) {
        mst[i * 2] = mst[i * 2 + 1] = -1;
    }
    trace_rapid(0);
    char** nm = (char**)name;
    visited[start] = 1;
    for (i = 0, k = 0; i < n; i++) {
        int min = INF, m, t;
        for (j = 0; j < n; j++) {
            if (visited[j] == 0 && dist[j] < min) {
                dist[j] = dist[j];
                min = dist[j];
                m = j;
            }
        }
        if (min == INF) break;
        trace_log(format("访问：%s", nm[m]));
        for (j = 0; j < n; j++) {
            if (j == m) continue;
            adj[pt(m, j)] = adj[pt(m, j)];
            if (adj[pt(m, j)] < INF && dist[j] > adj[pt(m, j)])
                dist[j] = adj[pt(m, j)];
        }
        min = INF;
        for (j = 0; j < n; j++) {
            if (visited[j] == 1 && adj[pt(j, m)] < INF && adj[pt(j, m)] < min) {
                min = adj[pt(j, m)];
                t = j;
            }
        }
        trace_rapid(1);
        mst[k++] = t; mst[k++] = m;
        trace_rapid(0);
        visited[m] = 1;
    }
    trace_rapid(1);
    for (i = 0; i < n - 1; i++) {
        int idx = pt(mst[i * 2], mst[i * 2 + 1]);
        adj[idx] = adj[idx];
    }
    trace_rapid(0);
}