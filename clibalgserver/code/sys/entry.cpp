#include "/include/io"
#include "/include/shell"
int main(int argc, char **argv) {
    path_add("/exe");
    int pid = shell("/usr/main");
    if (pid < 0) {
        switch (pid) {
        case -1:
            set_fg(240, 0, 0);
            put_string("[ERROR] File not exists.\n");
            restore_fg();
            break;
        case -2:
            set_fg(240, 0, 0);
            put_string("[ERROR] Compile failed.\n");
            shell("cat /log/err");
            restore_fg();
            break;
        case -3:
            set_fg(240, 0, 0);
            put_string("[ERROR] Cannot execute system programs!\n");
            restore_fg();
            break;
        }
    }
    return 0;
}