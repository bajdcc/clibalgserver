//
// Project: clibparser
// Created by bajdcc
//

#include "stdafx.h"
#include "cnet.h"

#define LOG_NET 0

namespace clib {

    CString cnet::Utf8ToStringT(LPCSTR str)
    {
        _ASSERT(str);
        USES_CONVERSION;
        auto length = MultiByteToWideChar(CP_UTF8, 0, str, -1, nullptr, 0);
        CString s;
        auto buf = s.GetBuffer(length + 1);
        ZeroMemory(buf, (length + 1) * sizeof(WCHAR));
        MultiByteToWideChar(CP_UTF8, 0, str, -1, buf, length);
        s.ReleaseBuffer();
        return s;
    }

    CString cnet::GBKToStringT(LPCSTR str)
    {
        _ASSERT(str);
        USES_CONVERSION;
        auto length = MultiByteToWideChar(CP_ACP, 0, str, -1, nullptr, 0);
        CString s;
        auto buf = s.GetBuffer(length + 1);
        ZeroMemory(buf, (length + 1) * sizeof(WCHAR));
        MultiByteToWideChar(CP_ACP, 0, str, -1, buf, length);
        s.ReleaseBuffer();
        return s;
    }

    CStringA cnet::StringTToUtf8(CString str)
    {
        USES_CONVERSION;
        auto length = WideCharToMultiByte(CP_UTF8, 0, str, -1, nullptr, 0, nullptr, nullptr);
        CStringA s;
        auto buf = s.GetBuffer(length + 1);
        ZeroMemory(buf, (length + 1) * sizeof(CHAR));
        WideCharToMultiByte(CP_UTF8, 0, str, -1, buf, length, nullptr, nullptr);
        return s;
    }
}