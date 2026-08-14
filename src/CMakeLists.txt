# === Ядро расчётов (static lib, без Qt Widgets) ===
add_library(engicalc_core STATIC
    core/placeholder.cpp
)
target_include_directories(engicalc_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}/generated
)
target_link_libraries(engicalc_core PUBLIC Qt6::Core)

# === Модуль КИПиА (static lib, опционально) ===
if(BUILD_KIPIA)
    add_library(engicalc_kipia STATIC
        kipia/placeholder.cpp
    )
    target_include_directories(engicalc_kipia PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_BINARY_DIR}/generated
    )
    target_link_libraries(engicalc_kipia PUBLIC Qt6::Core)
endif()

# === Утилиты ===
add_library(engicalc_util STATIC
    util/placeholder.cpp
)
target_include_directories(engicalc_util PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}/generated
)
target_link_libraries(engicalc_util PUBLIC Qt6::Core)

# === Исполняемый файл ===
add_executable(EngiCalc
    main.cpp
    ui/mainwindow.cpp
    ui/mainwindow.h
)
target_include_directories(EngiCalc PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}/generated
)
target_link_libraries(EngiCalc PRIVATE
    Qt6::Widgets
    Qt6::Core
    Qt6::Gui
    Qt6::PrintSupport
    Qt6::Svg
    engicalc_core
    engicalc_util
)

if(BUILD_KIPIA)
    target_link_libraries(EngiCalc PRIVATE engicalc_kipia)
    target_compile_definitions(EngiCalc PRIVATE BUILD_KIPIA)
endif()
