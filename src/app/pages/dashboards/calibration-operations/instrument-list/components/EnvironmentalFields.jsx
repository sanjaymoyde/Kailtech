import { Input, Select } from "components/ui";
import ReactSelect from "react-select";

function EnvironmentalFields({
  formData,
  errors,
  handleInputChange,
  handleSingleSelectChange,
  handleMultiSelectChange,
  labOptions,
  formateOptions,
}) {
  return (
    <>
      {/* Temperature & Humidity for Site */}
      <div>
        <Input
          label="Temperature Range for Site"
          name="tempsite"
          placeholder="Enter Temperature Range for Site"
          type="number"
          value={formData.tempsite}
          onChange={handleInputChange}
          className={errors.tempsite ? "border-red-500 bg-red-50" : ""}
        />
        {errors.tempsite && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Temperature Variable Site"
          name="tempvariablesite"
          placeholder="Enter Temperature Variable Site"
          type="number"
          value={formData.tempvariablesite}
          onChange={handleInputChange}
          className={errors.tempvariablesite ? "border-red-500 bg-red-50" : ""}
        />
        {errors.tempvariablesite && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Humidity Range for Site"
          name="humisite"
          placeholder="Enter Humidity Range for Site"
          type="number"
          value={formData.humisite}
          onChange={handleInputChange}
          className={errors.humisite ? "border-red-500 bg-red-50" : ""}
        />
        {errors.humisite && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Humidity Variable Site"
          name="humivariablesite"
          placeholder="Enter Humidity Variable Site"
          type="number"
          value={formData.humivariablesite}
          onChange={handleInputChange}
          className={errors.humivariablesite ? "border-red-500 bg-red-50" : ""}
        />
        {errors.humivariablesite && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      {/* Temperature & Humidity for Lab */}
      <div>
        <Input
          label="Temperature Range for Lab"
          name="templab"
          type="number"
          placeholder="Enter Temperature Range for Lab"
          value={formData.templab}
          onChange={handleInputChange}
          className={errors.templab ? "border-red-500 bg-red-50" : ""}
        />
        {errors.templab && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Temperature Variable Lab"
          type="number"
          placeholder="Enter Temperature Variable Lab"
          name="tempvariablelab"
          value={formData.tempvariablelab}
          onChange={handleInputChange}
          className={errors.tempvariablelab ? "border-red-500 bg-red-50" : ""}
        />
        {errors.tempvariablelab && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Humidity Range for Lab"
          name="humilab"
          placeholder="Enter Humidity Range for Lab"
          type="number"
          value={formData.humilab}
          onChange={handleInputChange}
          className={errors.humilab ? "border-red-500 bg-red-50" : ""}
        />
        {errors.humilab && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <Input
          label="Humidity Variable Lab"
          name="humivariablelab"
          type="number"
          placeholder="Enter Humidity Variable Lab"
          value={formData.humivariablelab}
          onChange={handleInputChange}
          className={errors.humivariablelab ? "border-red-500 bg-red-50" : ""}
        />
        {errors.humivariablelab && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      {/* Additional Certificate Fields */}
      <div>
        <Input
          label="Specification Heading"
          name="specificationheading"
          placeholder="Enter Specification Heading"
          value={formData.specificationheading}
          onChange={handleInputChange}
          className={
            errors.specificationheading ? "border-red-500 bg-red-50" : ""
          }
        />
        {errors.specificationheading && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Show Masters In Certificate
        </label>
        <Select
          name="mastersincertificate"
          value={formData.mastersincertificate}
          onChange={handleInputChange}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Show Uncertainty In Certificate
        </label>
        <Select
          name="uncertaintyincertificate"
          value={formData.uncertaintyincertificate}
          onChange={handleInputChange}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Lab to Calibrate
        </label>
        <ReactSelect
          name="allottolab"
          options={labOptions}
          value={
            labOptions.find((opt) => opt.value === formData.allottolab) || null
          }
          onChange={(selected) =>
            handleSingleSelectChange(selected, "allottolab")
          }
          placeholder="Select Lab"
        />
      </div>

      {/* Format Field */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Format
        </label>
        <ReactSelect
          isMulti={false}
          name="suffix"
          options={formateOptions}
          value={
            formateOptions.find((opt) => opt.value === formData.suffix) || null
          }
          onChange={(selected) => handleMultiSelectChange(selected, "suffix")}
          placeholder="Select Format"
          className={errors.suffix ? "border-red-500 bg-red-50" : ""}
        />
        {errors.suffix && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      {/* Uncertainty Sheet Field */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
          Uncertainty Sheet
        </label>
        <ReactSelect
          isMulti
          name="uncertaintytable"
          options={formateOptions}
          value={formateOptions.filter((opt) =>
            formData.uncertaintytable.includes(opt.value),
          )}
          onChange={(selected) =>
            handleMultiSelectChange(selected, "uncertaintytable")
          }
          placeholder="Select Uncertainty"
          className={errors.uncertaintytable ? "border-red-500 bg-red-50" : ""}
        />
        {errors.uncertaintytable && (
          <p className="mt-1 text-sm text-red-600">This field is required</p>
        )}
      </div>

      {/* Remark Field */}
      <div>
        <Input
          label="Remark"
          name="remark"
          placeholder="Enter Remark"
          value={formData.remark}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
}

export default EnvironmentalFields;
