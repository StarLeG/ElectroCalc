# EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
# Copyright (C) 2026 Старинский Олег Григорьевич
# Licensed under LGPL v3.0

cmake_minimum_required(VERSION 3.19)

project(EngiCalc
    VERSION 1.0.0
    DESCRIPTION "Инженерные расчёты: электрика, КИПиА, автоматика"
    LANGUAGES CXX
)

# === Компилятор ===
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# === Опции сборки ===
option(BUILD_TESTS "Сборка тестов" ON)
option(BUILD_KIPIA "Сборка модуля КИПиА" ON)

# === Qt 6 ===
find_package(Qt6 REQUIRED COMPONENTS Widgets Core Gui PrintSupport Svg)

# === Версия из git ===
execute_process(
    COMMAND git describe --tags --always --dirty
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE GIT_VERSION
    OUTPUT_STRIP_TRAILING_WHITESPACE
    ERROR_QUIET
    RESULT_VARIABLE GIT_RESULT
)
if(NOT GIT_RESULT EQUAL 0)
    set(GIT_VERSION "dev")
endif()

# === version.h ===
configure_file(
    ${CMAKE_SOURCE_DIR}/src/version.h.in
    ${CMAKE_BINARY_DIR}/generated/version.h
    @ONLY
)

# === Подпроекты ===
add_subdirectory(src)

if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()
