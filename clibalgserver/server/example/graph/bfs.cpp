#include "/include/io"
#include "/include/math"
#include "/include/trace"
#include "/include/format"
struct point {
    int x, y;
};
point new_pt(int x, int y) {
    point pt;
    pt.x = x;
    pt.y = y;
    return pt;
}
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
void bfs(char* map, int m, int n, int sx, int sy, int ex, int ey) {
    point* queue = malloc(m * n * sizeof(point));
    int front = 0, rear = 0, i;
    queue[rear++] = new_pt(sx, sy);
    while (front < rear) {
        output(format("队列：头=%d，尾=%d", front, rear));
        point p = queue[front++];
        sx = p.x; sy = p.y;
        if (sx == ex && sy == ey) {
            output(format("到达终点：（%d，%d）", sx, sy));
            suc = true;
            break;
        }
        if (map[pt(sx, sy)] != 'S' && map[pt(sx, sy)] != ' ')
            continue;
        if (map[pt(sx, sy)] == ' ')
            map[pt(sx, sy)] = '*';
        output(format("遍历：（%d，%d）", sx, sy));
        for (i = 0; i < 4; i++) {
            int x = sx + dir[i * 2];
            int y = sy + dir[i * 2 + 1];
            if (map[pt(x, y)] == ' ' || map[pt(x, y)] == 'E') {
                queue[rear++] = new_pt(x, y);
            }
        }
    }
}
int main(int argc, char** argv) {
    int m = 8, n = 8, i, j;
    int sx = 1, sy = 1, ex = m, ey = n;
    int rands = m * n / 4;
    char* map = malloc((m + 2) * (n + 2) * sizeof(char));
    L = n + 2;
    trace_log("宽度优先搜索");
    trace_array_2d("图表", map, T_CHAR, m + 2, n + 2);
    trace_log("造墙中");
    for (i = 1; i <= m; i++) {
        trace_rapid(1);
        for (j = 1; j <= n; j++)
            map[pt(i, j)] = ' ';
        trace_rapid(0);
    }
    trace_rapid(1);
    for (i = 0; i < m + 2; i++)
        map[pt(i, 0)] = map[pt(i, n + 1)] = 'X';
    for (j = 0; j < n + 2; j++)
        map[pt(0, j)] = map[pt(m + 1, j)] = 'X';
    trace_rapid(0);
    trace_log("设置起点");
    map[pt(sx, sy)] = 'S';
    trace_log("设置终点");
    map[pt(ex, ey)] = 'E';
    trace_log("造障碍物");
    for (i = 0; i < rands;) {
        int x = rand() % m + 1;
        int y = rand() % n + 1;
        if (map[pt(x, y)] == ' ') {
            map[pt(x, y)] = 'O';
            i++;
        }
    }
    bfs(map, m, n, sx, sy, ex, ey);
    if (suc) 
        trace_log("成功");
    else
        trace_log("失败");
    trace_end("数组");
    trace_end("图表");
}