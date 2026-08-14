# === GoogleTest через FetchContent ===
include(FetchContent)

FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# === Smoke-тест ===
add_executable(smoke_test
    unit/smoke_test.cpp
)
target_link_libraries(smoke_test PRIVATE
    GTest::gtest_main
    engicalc_core
)
target_include_directories(smoke_test PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_BINARY_DIR}/generated
)

# === Тесты ядра расчётов ===
add_executable(core_tests
    unit/power_test.cpp
    unit/cable_test.cpp
    unit/voltage_drop_test.cpp
    unit/short_circuit_test.cpp
    unit/grounding_test.cpp
    unit/thermal_test.cpp
    unit/energy_test.cpp
    unit/protection_test.cpp
    unit/unitconverter_test.cpp
)
target_link_libraries(core_tests PRIVATE
    GTest::gtest_main
    engicalc_core
    engicalc_util
)
target_include_directories(core_tests PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_BINARY_DIR}/generated
)

include(GoogleTest)
gtest_discover_tests(smoke_test
    ENVIRONMENT "PATH=D:/Qt/Tools/mingw64_16.1.0/bin;D:/Qt/6.11.1/MinGW64_16.1.0/bin;$ENV{PATH}"
    DISCOVERY_TIMEOUT 10
)
gtest_discover_tests(core_tests
    ENVIRONMENT "PATH=D:/Qt/Tools/mingw64_16.1.0/bin;D:/Qt/6.11.1/MinGW64_16.1.0/bin;$ENV{PATH}"
    DISCOVERY_TIMEOUT 10
)
