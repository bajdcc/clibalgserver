//
// Project: clibparser
// Created by bajdcc
//

#ifndef CLIBPARSER_CNET_H
#define CLIBPARSER_CNET_H

#include "types.h"
#include "cvfs.h"

namespace clib {

    class cnet {
    public:
        cnet() = default;

        cnet(const cnet&) = delete;
        cnet& operator=(const cnet&) = delete;

        static CString Utf8ToStringT(LPCSTR str);
        static CString GBKToStringT(LPCSTR str);
        static CStringA StringTToUtf8(CString str);
    };
}

#endif //CLIBPARSER_CNET_H
