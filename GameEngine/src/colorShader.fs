#version 330 core


out vec4 FragmentColor;

uniform vec3 objectColor;
uniform vec3 lightColor;

void main(){
    FragmentColor = vec4(lightColor * objectColor, 1.0);
}