#include "stdafx.h"
#include "parser.h"
#include "parser2d/cgui.h"

namespace clib {

    CPARSER_API parser_ret parser(std::string input, std::string& output)
    {
        using namespace std::chrono;
        using namespace std::literals::chrono_literals;
        cgui gui;
        gui.set_main(input);
        auto now = std::chrono::system_clock::now();
        auto last_clock = std::chrono::system_clock::now();
        auto dt = std::chrono::duration_cast<std::chrono::seconds>(now - last_clock);
        while (gui.is_running() && dt < 2s) {
            gui.draw(false, 30.0);
            now = std::chrono::system_clock::now();
            dt = std::chrono::duration_cast<std::chrono::seconds>(now - last_clock);
        }
        auto run = gui.is_running();
        output = gui.output();
        gui.reset();
        if (run)
            output += "\n[ERROR] Running time out.";
        return P_OK;
    }

    CPARSER_API parser_ret visualize(std::string input, std::string& output)
    {
        using namespace std::chrono;
        using namespace std::literals::chrono_literals;
        cgui gui;
        gui.set_main(input);
        auto now = std::chrono::system_clock::now();
        auto last_clock = std::chrono::system_clock::now();
        auto dt = std::chrono::duration_cast<std::chrono::seconds>(now - last_clock);
        while (gui.is_running() && dt < 2s) {
            gui.draw(false, 30.0);
            now = std::chrono::system_clock::now();
            dt = std::chrono::duration_cast<std::chrono::seconds>(now - last_clock);
        }
        auto run = gui.is_running();
        output = gui.tracer();
        gui.reset();
        if (run)
            output += "\n[ERROR] Running time out.";
        return P_OK;
    }
}