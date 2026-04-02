
import { Button, Input, Select } from "components/ui";
import ReactSelect from "react-select";

function PriceListSection({
  priceLists,
  errors,
  currencyOptions,
  unitTypeOptions,
  unitOptions,
  modeOptions,
  handlePriceListChange,
  handlePriceCurrencyChange,
  handleMatrixChange,
  removeMatrix,
  addMatrix,
  removePriceList
}) {
  return (
    <>
      {/* Price Lists and Matrices */}
      {priceLists.map((price, priceIndex) => (
        <div
          key={priceIndex}
          className="col-span-1 md:col-span-2 border border-gray-300 p-4 rounded bg-gray-50 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Price List {priceIndex + 1}</h1>
            {priceLists.length > 1 && (
              <Button
                type="button"
                onClick={() => removePriceList(priceIndex)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remove Price List
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Input
                label="Package Name"
                name="packagename"
                placeholder="Enter Package Name"
                value={price.packagename}
                onChange={(e) => handlePriceListChange(priceIndex, e)}
                className={errors[`price_${priceIndex}_packagename`] ? "border-red-500 bg-red-50" : ""}
              />
              {errors[`price_${priceIndex}_packagename`] && (
                <p className="text-red-600 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <Input
                label="Package Description"
                placeholder="Enter Package Description"
                name="packagedesc"
                value={price.packagedesc}
                onChange={(e) => handlePriceListChange(priceIndex, e)}
                className={errors[`price_${priceIndex}_packagedesc`] ? "border-red-500 bg-red-50" : ""}
              />
              {errors[`price_${priceIndex}_packagedesc`] && (
                <p className="text-red-600 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                Accreditation
              </label>
              <Select
                name="accreditation"
                value={price.accreditation}
                onChange={(e) => handlePriceListChange(priceIndex, e)}
              >
                {/* <option value="">Select</option> */}
                <option value="Non Nabl">Non Nabl</option>
                <option value="Nabl">Nabl</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                Location
              </label>
              <Select
                name="location"
                value={price.location}
                onChange={(e) => handlePriceListChange(priceIndex, e)}
              >
                {/* <option value="">Select</option> */}
                <option value="Site">Site</option>
                <option value="Lab">Lab</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                Select Currency
              </label>
              <ReactSelect
                name="currency"
                value={price.currency}
                options={currencyOptions}
                onChange={(selected) => handlePriceCurrencyChange(selected, priceIndex)}
                placeholder="Select Currency"
              />
            </div>

            <div>
              <Input
                label="Rate"
                placeholder="Enter Rate"
                name="rate"
                value={price.rate}
                type="number"
                onChange={(e) => handlePriceListChange(priceIndex, e)}
                className={errors[`price_${priceIndex}_rate`] ? "border-red-500 bg-red-50" : ""}
              />
              {errors[`price_${priceIndex}_rate`] && (
                <p className="text-red-600 text-sm mt-1">This field is required</p>
              )}
            </div>

            <div>
              <Input
                label="Days Required"
                name="daysrequired"
                placeholder="Enter Days Required"
                type="number"
                min="1"
                value={price.daysrequired}
                onChange={(e) => handlePriceListChange(priceIndex, e)}
                className={errors[`price_${priceIndex}_daysrequired`] ? "border-red-500 bg-red-50" : ""}
              />
              {errors[`price_${priceIndex}_daysrequired`] && (
                <p className="text-red-600 text-sm mt-1">This field is required</p>
              )}
            </div>
          </div>

          {/* Matrices */}
          <div className="mt-4">
            <h2 className="text-md font-semibold mb-2"></h2>

            {price.matrices.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">
                No matrices added yet. Click below to add one.
              </p>
            )}

            {price.matrices.map((matrix, matrixIndex) => (
              <div
                key={`matrix-${priceIndex}-${matrixIndex}`}
                className="border border-gray-200 p-4 rounded mb-4 bg-white dark:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Matrix {matrixIndex + 1}
                  </h3>
                  {price.matrices.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => removeMatrix(priceIndex, matrixIndex)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Remove Matrix
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                      Unit Type/Parameter
                    </label>
                    <ReactSelect
                      name="unittype"
                      options={unitTypeOptions}
                      value={unitTypeOptions.find((opt) => opt.value === matrix.unittype) || null}
                      onChange={(selected) => handleMatrixChange(priceIndex, matrixIndex, { target: { name: 'unittype', value: selected?.value || '' } })}
                      placeholder="Select Unit Type"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                      Unit
                    </label>
                    <ReactSelect
                      name="unit"
                      options={unitOptions}
                      value={unitOptions.find((opt) => opt.value === matrix.unit) || null}
                      onChange={(selected) => handleMatrixChange(priceIndex, matrixIndex, { target: { name: 'unit', value: selected?.value || '' } })}
                      placeholder="Select Unit"
                    />
                  </div>

                  <Input
                    label="Instrument Range Min"
                    placeholder="Enter Instrument Range Min"
                    name="instrangemin"
                    type="number"
                    value={matrix.instrangemin}
                    onChange={(e) => handleMatrixChange(priceIndex, matrixIndex, e)}
                  />

                  <Input
                    label="Instrument Range Max"
                    placeholder="Enter Instrument Range Max"
                    name="instrangemax"
                    type="number"
                    value={matrix.instrangemax}
                    onChange={(e) => handleMatrixChange(priceIndex, matrixIndex, e)}
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                      Mode
                    </label>
                    <ReactSelect
                      name="mode"
                      options={[{ label: "Not Specified", value: "" }, ...modeOptions]}
                      value={[{ label: "Not Specified", value: "" }, ...modeOptions].find((opt) => opt.value === matrix.mode) || null}
                      onChange={(selected) => handleMatrixChange(priceIndex, matrixIndex, { target: { name: 'mode', value: selected?.value || '' } })}
                      placeholder="Select Mode"
                    />
                  </div>

                  <Input
                    label="Tolerance (±)"
                    name="tolerance"
                    value={matrix.tolerance}
                    type="number"
                    onChange={(e) => handleMatrixChange(priceIndex, matrixIndex, e)}
                  />

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
                      Tolerance Type
                    </label>
                    <ReactSelect
                      name="tolerancetype"
                      options={[
                        { label: "Not Specified", value: "" },
                        { label: "Fixed", value: "Fixed" },
                        { label: "%", value: "%" }
                      ]}
                      value={[
                        { label: "Not Specified", value: "" },
                        { label: "Fixed", value: "Fixed" },
                        { label: "%", value: "%" }
                      ].find((opt) => opt.value === matrix.tolerancetype) || null}
                      onChange={(selected) => handleMatrixChange(priceIndex, matrixIndex, { target: { name: 'tolerancetype', value: selected?.value || '' } })}
                      placeholder="Select Tolerance Type"
                    />
                  </div>

                  <Input
                    label="Discipline"
                    placeholder="Enter Discipline"
                    name="discipline"
                    value={matrix.discipline || ''}
                    onChange={(e) => handleMatrixChange(priceIndex, matrixIndex, e)}
                  />

                  <Input
                    label="Group"
                    placeholder="Enter Group"
                    name="group"
                    value={matrix.group || ''}
                    onChange={(e) => handleMatrixChange(priceIndex, matrixIndex, e)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={() => addMatrix(priceIndex)}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add Matrix
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export default PriceListSection;