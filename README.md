# MOZ_text: Text extension for glTF

This is an extension for glTF to support text objects.

The aim is not to save the mesh but only metadata about the content, font and text properties, so it is in the final application the decision of how to interpret and render it.

Currently only [threejs](https://github.com/mrdoob/three.js) is implemeted, temporarily modifying the [GLTFLoader](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js) while the [support for plugins](https://github.com/mrdoob/three.js/pull/18484) is not officially merged.

The ultimate goal would be to have a perfect match between Blender (or other 3d package) and the render engine, but given the multiple differences of how text is handled in all the steps, this is far from being perfect right now. Instead of that, this project aims to a very practical approach: to have a useful tool that we can use today for simple use cases.

For comparisons between Blender and threejs scenes, try the [test scene]() and compare it with the [blender scenes](https://github.com/feiss/MOZ_text/tree/master/test/blendfiles)

## Workflow and usage

This is meant to be used as follows:
1. **Install Add-on**

    In Blender, install the [io_scene_gltf2_moz_text](https://github.com/feiss/MOZ_text/blob/master/io_scene_gltf2_moz_text.zip)  add-on (`Edit > Preferences > Add-ons > "Install..."`), and turn on the add-on checkbox (see diagram below, 1).

2. **Add texts**

    Add and edit all the texts object in your scene (`shift+a > "Text"`). There is a MOZ_text panel at the bottom of the text properties (see diagram below, 2).

3. **Export**

    Export the scene (or selected objects) to glTF (`File > Export > glTF 2.0`), and find the extension general options at the end of the glTF options (see diagram below, 3).
    
4. **Add font files**

    Add the neccesary font files in your project folders. Use the same relative path as the one specified in the previous step.
    
5. **Load glTF**

    Use the custom GLTFLoader provided to load the glTF in threejs.

![workflow diagram](/doc/moz_text_workflow.png)
