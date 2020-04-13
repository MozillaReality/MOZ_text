# MOZ_text: Text extension for glTF

This is an extension for glTF to support text objects.

The aim is not to save the mesh but only metadata about the content, font and text properties, so it is in the final application the decision of how to interpret and render it.

Currently only [threejs](https://github.com/mrdoob/three.js) is supported, uglily hacking the [GLTFLoader](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js) while the [support for plugins](https://github.com/mrdoob/three.js/pull/18484) is not officially merged.

## Workflow


![workflow diagram](/doc/moz_text_workflow.png)
