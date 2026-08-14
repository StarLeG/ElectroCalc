# === Ядро расчётов (static lib, без Qt Widgets) ===
add_library(engicalc_core STATIC
    core/power.cpp
    core/cable.cpp
    core/voltage_drop.cpp
    core/short_circuit.cpp
    core/grounding.cpp
    core/thermal.cpp
    core/energy.cpp
    core/protection.cpp
    core/compensation.cpp
    core/motor.cpp
    core/transformer.cpp
    core/lighting.cpp
    core/ups.cpp
    core/trayfill.cpp
)
target_include_directories(engicalc_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}/generated
)
target_link_libraries(engicalc_core PUBLIC Qt6::Core)

# === Модуль КИПиА (static lib, опционально) ===
if(BUILD_KIPIA)
    add_library(engicalc_kipia STATIC
        kipia/currentloop.cpp
        kipia/signalscaling.cpp
        kipia/rtd.cpp
        kipia/pidtuning.cpp
        kipia/accuracy.cpp
    )
    target_include_directories(engicalc_kipia PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_BINARY_DIR}/generated
    )
    target_link_libraries(engicalc_kipia PUBLIC Qt6::Core)
endif()

# === Утилиты ===
add_library(engicalc_util STATIC
    util/theme.cpp
    util/unitconverter.cpp
    util/placeholder.cpp
)
target_include_directories(engicalc_util PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}/generated
)
target_link_libraries(engicalc_util PUBLIC Qt6::Core Qt6::Gui)

# === Исполняемый файл ===
add_executable(EngiCalc
    main.cpp
    ui/mainwindow.cpp
    ui/mainwindow.h
    ui/navigation.cpp
    ui/navigation.h
    ui/tabs/powertab.cpp
    ui/tabs/powertab.h
    ui/tabs/cabletab.cpp
    ui/tabs/cabletab.h
    ui/tabs/voltagedroptab.cpp
    ui/tabs/voltagedroptab.h
    ui/tabs/shortcircuittab.cpp
    ui/tabs/shortcircuittab.h
    ui/tabs/groundingtab.cpp
    ui/tabs/groundingtab.h
    ui/tabs/thermaltab.cpp
    ui/tabs/thermaltab.h
    ui/tabs/energytab.cpp
    ui/tabs/energytab.h
    ui/tabs/protectiontab.cpp
    ui/tabs/protectiontab.h
    ui/tabs/extensionstab.cpp
    ui/tabs/extensionstab.h
    ui/tabs/kipiatab.cpp
    ui/tabs/kipiatab.h
    ui/referencebrowser.cpp
    ui/referencebrowser.h
    models/cabledatamodel.cpp
    models/cabledatamodel.h
    ${CMAKE_SOURCE_DIR}/resources/resource.qrc
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
