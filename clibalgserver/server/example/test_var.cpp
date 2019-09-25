#include "/include/io"
#include "/include/trace"
int main(int argc, char** argv) {
    int a = 0;
    trace_var("a", &a, T_INT);
    a = 1;
    trace_end("a");
}