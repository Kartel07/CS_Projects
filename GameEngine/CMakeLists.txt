cmake_minimum_required(VERSION 3.15)
project(VisualizationEngine VERSION 1.0 LANGUAGES C CXX)

# Set modern C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# 1. Find MSYS2 Installed Packages
find_package(glfw3 REQUIRED)
find_package(assimp REQUIRED)
# GLM is header-only, MSYS2 places it in the standard include path

# 2. Define External Source Files (ImGui and GLAD)
set(IMGUI_SOURCES
    external/imgui/imgui.cpp
    external/imgui/imgui_draw.cpp
    external/imgui/imgui_tables.cpp
    external/imgui/imgui_widgets.cpp
    external/imgui/imgui_impl_glfw.cpp
    external/imgui/imgui_impl_opengl3.cpp
)

set(GLAD_SOURCES
    external/glad/src/glad.c
)

# 3. Define the Executable
add_executable(${PROJECT_NAME} 
    src/main.cpp 
    ${IMGUI_SOURCES} 
    ${GLAD_SOURCES}
)

# 4. Include Directories (Where the compiler looks for header files)
target_include_directories(${PROJECT_NAME} PRIVATE
    external/glad/include
    external/imgui
    external/stb
)

# 5. Link Libraries (Wiring the binaries together)
# opengl32 is the native Windows OpenGL library
target_link_libraries(${PROJECT_NAME} PRIVATE
    glfw
    assimp
    opengl32 
)