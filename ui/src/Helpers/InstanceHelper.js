export const normalizeInstanceData = (data, transformField=null) => {
  const instance = {id: null, types: [], primaryType: {name: "", color: "", label: ""}, workspace: "", name: "", fields: {}, labelField: null, promotedFields: [], alternatives: {}, metadata: {}, permissions: {}, error: null};
  if (!data) {
    return instance;
  }
  if (data.id) {
    instance.id = data.id;
  }
  if (data.types instanceof Array) {
    instance.types = data.types;
    if (instance.types.length) {
      instance.primaryType = instance.types[0];
    }
  }
  if (data.workspace) {
    instance.workspace = data.workspace;
  }
  if (data.name) {
    instance.name = data.name;
  }
  if (data.labelField) {
    instance.labelField = data.labelField;
  }
  if (data.promotedFields instanceof Array) {
    instance.promotedFields = data.promotedFields;
  }
  if (typeof data.fields === "object") {
    for(let fieldKey in data.fields) {
      const field = data.fields[fieldKey];
      // TODO: temporary, please remove
      if (!field.type) {
        if (["http://schema.org/children", "http://schema.org/colleague", "http://schema.org/spouse", "http://schema.org/affiliation"].includes(fieldKey)) {
          field.type = "DropdownSelect";
        } else {
          field.type = "InputText";
        }
      }
      typeof transformField === "function"  && transformField(field);
      if(field.type === "InputText"){
        field.type = "KgInputText";
      } else if(field.type === "TextArea"){
        field.type = "KgTextArea";
      } else if(field.type === "DropdownSelect" || field.type === "DynamicDropdown"  || field.type === "KgTable"){
        if(field.type === "DropdownSelect") {
          field.type = "DynamicDropdown";
        }
        field.instanceId = instance.id;
        field.isLink = true;
        field.mappingLabel = "name";
        field.mappingValue = "id";
        field.mappingReturn = ["id"];
        field.closeDropdownAfterInteraction = true;
      }
    }
    instance.fields = data.fields;
  }
  if (typeof data.alternatives === "object") {
    instance.alternatives = data.alternatives;
  }
  if (typeof data.metadata === "object") {
    const metadata = data.metadata;
    instance.metadata = Object.keys(metadata).map(key => {
      if(key == "lastUpdateAt" || key == "createdAt") {
        const d = new Date(metadata[key].value);
        metadata[key].value = d.toLocaleString();
      }
      return metadata[key];
    });
  }
  if (typeof data.permissions === "object") {
    instance.permissions = data.permissions;
  }
  if (typeof data.error === "object") {
    instance.error = data.error;
  }
  return instance;
};