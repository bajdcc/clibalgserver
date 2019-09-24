#pragma once

#include <string>

#ifdef CPARSER_EXPORTS
#define CPARSER_API   __declspec(dllexport)
#else
#define CPARSER_API    __declspec(dllimport)
#endif

namespace clib {

    enum parser_ret {
        P_OK,
        P_ERROR,
    };

    CPARSER_API parser_ret parser(std::string input, std::string& output);
    CPARSER_API parser_ret visualize(std::string input, std::string& output);
}