
import { Input } from "components/ui";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";

function Instrument({
  formData,
  errors,
  handleInputChange,
  handleMultiSelectChange,
  sopOptions,
  standardOptions,
  disciplineOptions = [],
  groupOptions = [],
}) {
  const toValueArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      return value.split(",").map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };
  return (
    <>
      <div>
        <Input
          label="Instrument Name"
          placeholder="Enter Instrument Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={errors.name ? "border-red-500 bg-red-50" : ""}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Calibration Method / SOP <span className="text-red-500">*</span>
        </label>
        <ReactSelect
          isMulti
          name="sop"
          options={sopOptions}
          value={sopOptions.filter((opt) => formData.sop.includes(opt.value))}
          onChange={(selected) => handleMultiSelectChange(selected, "sop")}
          placeholder="Select Calibration Methods"
          className={errors.sop ? "react-select-error" : ""}
        />
        {errors.sop && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Calibration Standard
        </label>
        <ReactSelect
          isMulti
          name="standard"
          options={standardOptions}
          value={standardOptions.filter((opt) => formData.standard.includes(opt.value))}
          onChange={(selected) => handleMultiSelectChange(selected, "standard")}
          placeholder="Select Calibration Standards"
        />
      </div>

      <div>
        <Input
          label="Instrument Description"
          name="description"
          placeholder="Enter Instrument Description"
          value={formData.description}
          onChange={handleInputChange}
          className={errors.description ? "border-red-500 bg-red-50" : ""}
        />
        {errors.description && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>

      <input type="hidden" name="vertical" value={formData.vertical} />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Discipline
        </label>
        <CreatableSelect
          isMulti
          name="discipline"
          options={disciplineOptions}
          value={toValueArray(formData.discipline).map((v) => ({ value: v, label: v }))}
          onChange={(selected) => handleMultiSelectChange(selected, "discipline")}
          placeholder="Select Discipline"
          className={errors.discipline ? "react-select-error" : ""}
        />
        {errors.discipline && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Group
        </label>
        <CreatableSelect
          isMulti
          name="groups"
          options={groupOptions}
          value={toValueArray(formData.groups).map((v) => ({ value: v, label: v }))}
          onChange={(selected) => handleMultiSelectChange(selected, "groups")}
          placeholder="Select Group"
          className={errors.groups ? "react-select-error" : ""}
        />
        {errors.groups && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>

      <div>
        <Input
          placeholder="Enter Remark"
          label="Remark"
          name="remark"
          value={formData.remark}
          onChange={handleInputChange}
          className={errors.remark ? "border-red-500 bg-red-50" : ""}
        />
        {errors.remark && (
          <p className="text-red-600 text-sm mt-1">This field is required</p>
        )}
      </div>
    </>
  );
}

export default Instrument;
