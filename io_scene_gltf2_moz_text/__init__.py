import bpy
from os import path
from bpy.app.handlers import persistent

bl_info = {
    "name": "MOZ_text glTF Extension",
    "category": "Import-Export",
    "version": (1, 0, 0),
    "blender": (2, 80, 0),
    'location': 'File > Export > glTF 2.0',
    'description': 'Custom glTF extension to support text nodes',
    'tracker_url': "https://",  # Replace with your issue tracker
    'isDraft': False,
    'developer': "Diego F. Goberna", # Replace this
    'url': 'https://',  # Replace this
}

# glTF extensions are named following a convention with known prefixes.
# See: https://github.com/KhronosGroup/glTF/tree/master/extensions#about-gltf-extensions
# also: https://github.com/KhronosGroup/glTF/blob/master/extensions/Prefixes.md
glTF_extension_name = "MOZ_text"

# Support for an extension is "required" if a typical glTF viewer cannot be expected
# to load a given model without understanding the contents of the extension.
# For example, a compression scheme or new image format (with no fallback included)
# would be "required", but physics metadata or app-specific settings could be optional.
extension_is_required = False

class MOZTextProperties(bpy.types.PropertyGroup):
    enabled: bpy.props.BoolProperty(
        name=bl_info["name"],
        description='Include this extension in the exported glTF file.',
        default=True
        )
    float_property: bpy.props.FloatProperty(
        name='Sample FloatProperty',
        description='This is an example of a FloatProperty used by a UserExtension.',
        default=1.0
        )

def register():
    bpy.utils.register_class(MOZTextProperties)
    bpy.types.Scene.MOZTextProperties = bpy.props.PointerProperty(type=MOZTextProperties)
    bpy.utils.register_class(AdditionalTextPropertiesPanel)

    bpy.app.handlers.frame_change_pre.append(afterExport)

def register_panel():
    # Register the panel on demand, we need to be sure to only register it once
    # This is necessary because the panel is a child of the extensions panel,
    # which may not be registered when we try to register this extension
    try:
        bpy.utils.register_class(GLTF_PT_UserExtensionPanel)
    except Exception:
        pass

    # If the glTF exporter is disabled, we need to unregister the extension panel
    # Just return a function to the exporter so it can unregister the panel
    return unregister_panel


def unregister_panel():
    # Since panel is registered on demand, it is possible it is not registered
    try:
        bpy.utils.unregister_class(GLTF_PT_UserExtensionPanel)
        bpy.utils.unregister_class(AdditionalTextPropertiesPanel)
    except Exception:
        pass


def unregister():
    unregister_panel()
    bpy.utils.unregister_class(MOZTextProperties)
    del bpy.types.Scene.MOZTextProperties

    bpy.app.handlers.frame_change_pre.remove(afterExport)

class GLTF_PT_UserExtensionPanel(bpy.types.Panel):

    bl_space_type = 'FILE_BROWSER'
    bl_region_type = 'TOOL_PROPS'
    bl_label = "Enabled"
    bl_parent_id = "GLTF_PT_export_user_extensions"
    bl_options = {'DEFAULT_CLOSED'}

    @classmethod
    def poll(cls, context):
        sfile = context.space_data
        operator = sfile.active_operator
        return operator.bl_idname == "EXPORT_SCENE_OT_gltf"

    def draw_header(self, context):
        props = bpy.context.scene.MOZTextProperties
        self.layout.prop(props, 'enabled')

    def draw(self, context):
        layout = self.layout
        layout.use_property_split = True
        layout.use_property_decorate = False  # No animation.

        props = bpy.context.scene.MOZTextProperties
        layout.active = props.enabled

        box = layout.box()
        box.label(text=glTF_extension_name)

        props = bpy.context.scene.MOZTextProperties
        layout.prop(props, 'float_property', text="Some float value")


class glTF2ExportUserExtension:
    def __init__(self):
        # We need to wait until we create the gltf2UserExtension to import the gltf2 modules
        # Otherwise, it may fail because the gltf2 may not be loaded yet
        from io_scene_gltf2.io.com.gltf2_io_extensions import Extension
        self.Extension = Extension
        self.properties = bpy.context.scene.MOZTextProperties
        self.text_index = 0

    def gather_node_hook(self, gltf2_object, blender_object, export_settings):
        if not blender_object.type == 'FONT':
            return

        o = blender_object

        o.undoExportActions = True

        ext_data = dict()
        ext_data['index'] = self.text_index
        ext_data['type'] = o.text_type.lower()
        ext_data['color'] = (o.text_color[0], o.text_color[1], o.text_color[2], o.text_color[3])
        ext_data['alignX'] = o.data.align_x.lower()
        ext_data['alignY'] = o.data.align_y.lower()
        ext_data['value'] = o.data.body
        ext_data['fontName'] = o.data.font.name # postscript name
        ext_data['fontFile'] = o.data.font.filepath.split(path.sep).pop()
        ext_data['size'] = o.data.size
        ext_data['maxWidth'] = o.data.text_boxes[0].width
        ext_data['overflow'] = o.data.overflow
        ext_data['letterSpacing'] = o.data.space_character - 1
        ext_data['lineSpacing'] = o.data.space_line
        ext_data['dimensions'] = (o.dimensions.x, o.dimensions.y)
        # extrude/bevel
        if ext_data['type'] == 'geometry':
            ext_data['extrude'] = o.data.extrude
            ext_data['extrudeResolution'] = o.data.resolution_u
            ext_data['bevel'] = o.data.bevel_depth
            ext_data['bevelOffset'] = o.data.offset
            ext_data['bevelResolution'] = o.data.bevel_resolution

#        renderEngine = 'CYCLES' if bpy.context.scene.render.engine == 'CYCLES' else 'EEVEE'
#        material = o.active_material
#        if material.use_nodes:
#            color = material.node_tree.get_output_node(renderEngine).inputs[0].links[0].from_node.inputs[0].default_value
#        else:
#            color = material.diffuse_color
#        ext_data['color'] = [color[0], color[1], color[2]]

        self.text_index += 1

        if self.properties.enabled:
            if gltf2_object.extensions is None:
                gltf2_object.extensions = {}
            gltf2_object.extensions[glTF_extension_name] = self.Extension(
                name = glTF_extension_name,
                extension = ext_data,
                required = extension_is_required
            )

text_type = (
    ('TEXTURE', "Texture", "Text rendered on a texture"),
    ('GEOMETRY', "Geometry", "Text rendered with a polygon mesh"),
    ('SDF', "SDF", "Text rendered with a SDF shader")
)

bpy.types.Object.text_type = bpy.props.EnumProperty(
    name = "Text Type",
    description = "How this text should be rendered in realtime",
    items = text_type,
    default = 'SDF',
)

bpy.types.Object.text_color = bpy.props.FloatVectorProperty(
    name = "Text Color",
    description = "Text color",
    default = (1.0, 1.0, 1.0, 1.0),
    size = 4,
    min = 0,
    max = 1,
    subtype = 'COLOR'
)


class AdditionalTextPropertiesPanel(bpy.types.Panel):
    """Creates a Panel in the data properties window"""
    bl_label = "MOZ_text extension"
    bl_idname = "OBJECT_PT_moztextpanel"
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = "data"

    def draw(self, context):
        layout = self.layout

        obj = context.object
        if type(obj.data).__name__ != 'TextCurve': return

        row = layout.row()
        row.prop(obj, "text_type")
        row = layout.row()
        row.prop(obj, "text_color")


bpy.types.Object.undoExportActions = bpy.props.BoolProperty(
    name = "undoExportActions",
    description = "whether undoing modifications made during glTF export is needed",
    default = False
)

@persistent
def afterExport(scene):
  for obj in bpy.data.objects:
    if not obj.type == 'FONT' or not obj.undoExportActions: continue
    obj.undoExportActions = False

