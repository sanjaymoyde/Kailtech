import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { AppLayout } from "app/layouts/AppLayout";
import { DynamicLayout } from "app/layouts/DynamicLayout";
import {
  canAccessDashboardsRoute,
  getStoredPermissions,
} from "app/navigation/dashboards";
import AuthGuard from "middleware/AuthGuard";

// ----------------------------------------------------------------------

import { useLabsContext } from "app/contexts/labs/context";

function DashboardPermissionGuard() {
  const outlet = useOutlet();
  const { pathname, search } = useLocation();
  const permissions = getStoredPermissions();
  const { labs, loading } = useLabsContext();
  const employeeId = Number(localStorage.getItem("userId") || 0);

  if (loading) {
    return null; // Or a loading spinner, but null is fine to defer rendering
  }

  if (
    pathname.startsWith("/dashboards") &&
    !canAccessDashboardsRoute({ pathname, search, permissions })
  ) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Check dynamic lab permissions
  if (pathname.startsWith("/dashboards/material-list/")) {
    const segments = pathname.split("/");
    if (segments.length >= 4) {
      const labSlug = segments[3];
      const matchedLab = labs.find((lab) => lab.slug === labSlug);
      
      if (!matchedLab || !matchedLab.users?.includes(employeeId)) {
        throw new Response("Unauthorized", { status: 401 });
      }
    }
  }

  return <>{outlet}</>;
}

const protectedRoutes = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards" />,
        },
        {
          path: "dashboards",
          Component: DashboardPermissionGuard,
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/home")).default,
              }),
            },
            {
              path: "material-list",
              children: [
                {
                  path: ":labSlug", // This catches all slugs dynamically
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "AddNewInstrument",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/AddNewInstrument"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/Edit"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-equipment-history/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/ViewEquipmentHistory"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "maintenance-equipment-history",
                      children: [
                        {
                          path: "",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "view-review-form",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ViewReviewForm"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "edit-validity",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/EditValidity"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "add-imc",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/AddImc"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "view-imc",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ViewIntermediateCheck"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "edit-imc",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/EditIntermediateCheck"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "view-planner",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ViewPlanner"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "view-planner-intermediate-check",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ViewPlannerIntermediateCheck"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "add-observation",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/AddObservation"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "add-new-equipment-history",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/AddNewEquipmentHistory"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "clone-certificate-details",
                          lazy: async () => ({
                            Component: (
                              await import(
                                "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/CloneCertificateDetails"
                              )
                            ).default,
                          }),
                        },
                        {
                          path: "validity-detail",
                          children: [
                            {
                              path: "",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/index"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "add-new-master-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/AddNewMasterMatrix"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "add-new-uncertainty-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/UncertaintyMatrixForm"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "edit-new-master-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/EditNewMasterMatrix"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "edit-new-uncertinity-master-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/EditNewUncertinityMatrix"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "add-new-uncertinity-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/AddNewUncertinityMatrix"
                                  )
                                ).default,
                              }),
                            },
                            {
                              path: "edit-new-uncertinity-matrix",
                              lazy: async () => ({
                                Component: (
                                  await import(
                                    "app/pages/dashboards/material-list/electro-technical/MaintenanceEquipmentHistory/ValidityDetail/EditNewUncertinityMatrix"
                                  )
                                ).default,
                              }),
                            },
                          ],
                        },
                      ],
                    },
                    {
                      path: "dump/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/dump"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "log-book/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/Logbook"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-verification-list/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/ViewVerificationList"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "verification-list",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/VarificationList"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-checklist/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/ViewChecklist"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-master-matrix",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/AddNewMasterMatrix"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-general-checklist-matrix",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/material-list/electro-technical/AddNewGeneralChecklistMatrix"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },

            {
              path: "operations",
              children: [
                {
                  path: "observation-settings",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/Operations/observation-settings"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/Operations/observation-settings/Add"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/Operations/observation-settings/Edit"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-uncertainty/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/Operations/observation-settings/EditUncertainty"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },

            {
              path: "master-data",
              children: [
                {
                  path: "unit-types",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/UnitTypes"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/UnitTypes/AddUnitType"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/UnitTypes/EditUnitType"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "modes",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/master-data/Modes")
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Modes/AddModes"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Modes/EditModes"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "tax-slabs",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/TaxSlabs"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/TaxSlabs/AddTaxSlab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/TaxSlabs/EditTaxSlab"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "verticals",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Verticals"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Verticals/AddVertical"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Verticals/EditVertical"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                //----------------------------master document---------------------------------
                {
                  path: "document-master",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterDocument"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterDocument/AddMasterDocument"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-training/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterDocument/EditTrainingModule"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-training-modules",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterDocument/ViewTrainingModules"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //----------------------------Statuary Details---------------------------------
                {
                  path: "statuary-detail",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/StatuaryDetail"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/StatuaryDetail/Edit"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-statuary-detail",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/StatuaryDetail/AddNewStatuaryDetail"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //---------------------------Master Calibration Return--------------

                {
                  path: "master-calibration-return",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterCalibrationReturn"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "fill-master-validity",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/MasterCalibrationReturn/FillMasterValidity"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //----------------------------Unit Conversion---------------------
                {
                  path: "units-conversion",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/UnitsConversion"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-unit-conversion",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/UnitsConversion/AddNewConversion"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "currencies",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Currencies"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Currencies/AddCurrency"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Currencies/EditCurrency"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "units",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/master-data/Units")
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Units/AddUnit"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/Units/EditUnit"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "manage-labs",
                  children: [
                    {
                      index: true,
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs/AddLab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs/EditLab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "schedule/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs/Schedule"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "environmental-record/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs/EnvironmentalRecord"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "manage-Enviornmental-range/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/ManageLabs/ManageEnviornmentalRange"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //  -------------------------------------------general-checklistst---------------------------------

                {
                  path: "general-checklists",
                  children: [
                    {
                      index: true,
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/GeneralChecklists"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-master-matrix",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/GeneralChecklists/AddGeneralChecklistMatrix"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-general-checklist-matrix",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/master-data/GeneralChecklists/AddGeneralChecklist"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "view-activity-log",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/master-data/ViewActivityLog"
                      )
                    ).default,
                  }),
                },
              ],
            },
            {
              path: "calibration-process",
              children: [
                {
                  path: "inward-entry-lab",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-sticker/:inwardId/:instId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewSticker"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-multiple-traceability/:inwardId/:instIds",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewMultipleTraceability"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "ViewMultiple/:inwardId/:instId?",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewMultiple"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-multiple-approved-certificate/:inwardId/:instId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewMultipleApprovedCertificate"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/AddInwardEntryLab"
                          )
                        ).default,
                      }),
                    },

                    {
                      path: "edit-inward-entry/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditInwardEntryLab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "quotation/view/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/QuotationDetails"
                          )
                        ).default,
                      }),
                    },

                    {
                      path: "add-inward-item/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/AddInwardItem"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-bd-person/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditBdPerson"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "crf-view/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/CrfView"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-documents/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewDocuments"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "srf-view/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/SrfView"
                          )
                        ).default,
                      }),
                    },

                    {
                      path: "edit-billing/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditBilling"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-customer/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditCustomer"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "fill-feedback/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/FillFeedback"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "review-inward/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ReviewInward"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-work-order/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditWorkOrder"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "technical-acceptance/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/TechnicalAcceptance"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "sample-transfer-in-lab/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/TransferInLab"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "perform-calibration/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/PerformCalibration"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "perform-calibration/add-crf/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/AddCrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "calibrate-step1/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/CalibrateStep1"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-crf/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/AddCrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "calibrate-step2/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/CalibrateStep2"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "calibrate-step3/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/CalibrateStep3"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-instrumental-crf/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/EditInstrumentalCrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "matrix/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/InstrumentMatrix "
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "review/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/Review"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "approve/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/Approve"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "clone-item/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/CloneItem"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-rawdata/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewRawData"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-cmc-calculation/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewCMCCalculation"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-certificate/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewCertificate"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-certificate-with-lh/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/viewCertificateWithlh"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "regenerate-cache/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/RegenerateCache"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-traceability/:id/:itemId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-process/inward-entry-lab/ViewTraceability"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },

            {
              path: "calibration-process",
              children: [
                {
                  path: "dispatch-list",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/dispatch-list"
                      )
                    ).default,
                  }),
                },

                {
                  path: "view-dispatch-form/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/dispatch-list/ViewDispatchForm"
                      )
                    ).default,
                  }),
                },
              ],
            },
            {
              path: "calibration-process",
              children: [
                {
                  path: "dispatch-register",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/dispatch-register"
                      )
                    ).default,
                  }),
                },
              ],
            },
            {
              path: "calibration-process",
              children: [
                {
                  path: "lead-managements",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/lead-managements"
                      )
                    ).default,
                  }),
                },

                {
                  path: "details/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/lead-managements/details"
                      )
                    ).default,
                  }),
                },
              ],
            },

            {
              path: "calibration-process",
              children: [
                {
                  path: "ulr-list",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/ulr-list/ulr"
                      )
                    ).default,
                  }),
                },
                {
                  path: "lrn-Brn-Register",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/calibration-process/lrnBrnRegister/lrn"
                      )
                    ).default,
                  }),
                },
              ],
            },

            {
              path: "calibration-operations",
              children: [
                {
                  path: "calibration-standards",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-standards"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-standards/AddCalibrationStandards"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-standards/EditCalibrationStandards"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "cmc-scope-sheet",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/cmc-scope-sheet"
                          )
                        ).default,
                      }),
                    },

                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/cmc-scope-sheet/EditCmcScopeSheet"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-cmc-scope",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/cmc-scope-sheet/AddNewCmcScope"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "calibration-methods",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-methods"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-methods/AddCalibrationMethods"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/calibration-methods/EditCalibrationMethods"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //--------------------bio-medical-visual-test------------------

                {
                  path: "bio-medical-visual-test",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-visual-test"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-visual-test", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-visual-test/AddVisualTest"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-visual-test-form/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-visual-test/EditVisualtestForm"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //--------------------bio-medical-safty-test------------------

                {
                  path: "bio-medical-safety-test",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-safety-test"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-visual-test", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-safety-test/AddVisualTest"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-visual-test-form/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-safety-test/EditVisualtestForm"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //-------------------Revision request-----------------------

                {
                  path: "revision-requests",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Revision-Request"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                //-------------------LRN Cancel Requests-----------------------
                {
                  path: "lrn-cancel-requests",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/lrn-cancel-requests"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                //--------------------Discipline------------------

                {
                  path: "discipline",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Discipline"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-new-discipline", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Discipline/AddNewDiscipline"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-visual-test-form",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/Bio-medical-safety-test/EditVisualtestForm"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "instrument-list",
                  children: [
                    {
                      path: "", // List Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add", // Add Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/AddCalibrationInstrument"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/EditCalibrationInstrumnet"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "clone/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/Cloneinstrument"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-prices/:instrumentId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/CalibrationPriceList"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-matrix/:instrumentId/:priceId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/ViewMatrixPage"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-calib-points/:priceId/:matrixId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/ViewCalibPointsPage"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-calib-point/:priceId/:matrixId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/AddCalibPoint"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-calib-point/:priceId/:matrixId/:calibPointId",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/calibration-operations/instrument-list/EditCalibPoint"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },
            // ==========================Testing==========================
            {
              path: "testing",
              children: [
                {
                  path: "products",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/testing/products")
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/products/AddProduct"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/products/EditProduct"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "product-grades",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-grades"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-grades/AddProductGrade"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-grades/EditProductGrade"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "product-size",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-size"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-size/AddProductSize"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/product-size/EditProductSize"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "measurements",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/measurements"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/measurements/AddMeasurement"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/measurements/EditMeasurement"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "standards",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/testing/standards")
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/standards/AddStandard"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/standards/EditStandard"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "test-methods",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-methods"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-methods/AddTestMethod"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-methods/EditTestMethod"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "test-clauses",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-clauses"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-clauses/AddTestClause"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-clauses/EditTestClause"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "test-parameters",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-parameters"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-parameters/AddTestParameter"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-parameters/EditTestParameter"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "test-permissible-values",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-permissible-values"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-permissible-values/AddTestPermissibleValue"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/test-permissible-values/EditTestPermissibleValue"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "trfs-starts-jobs",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/AddTrfStartJob"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",

                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/EditTrfStartJob"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit_bd_person/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/EditTrfStartJobBdPerson"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "trfitems/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/AddTrfStartJobTrfItem"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "addPoDetailToTrf/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/AddPoDetailToTrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "editBillingDetailTrf/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/EditBillingDetailTrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "editmaincustomerTrf/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/EditMainCustomerTrf"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "customerFeedbackForm/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/CustomerFeedbackForm"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "samplereview/:id", // Edit Page
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/SampleReview"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "technical-acceptance/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/TechnicalAcceptance"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "slip/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/Slip"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "print-slip/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/PrintSlip"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "pending-technical-acceptance",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/trfs-starts-jobs/PendingTechnicalAcceptance"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "lrn-cancel-requests",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/lrn-cancel-requests"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "dispatch-list",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/dispatch-list"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "dispatchformtesting/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/testing/dispatch-list/DispatchFormTesting"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },
            // ========================action-item=======================
            {
              path: "action-items",
              children: [
                {
                  path: "pending-technical-acceptance",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/testing/trfs-starts-jobs/PendingTechnicalAcceptance"
                      )
                    ).default,
                  }),
                },
                {
                  path: "allot-sample",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/allot-sample/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "allot-sample/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/allot-sample/AllotSampleForm"
                      )
                    ).default,
                  }),
                },
                {
                  path: "accept-sample",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/accept-sample/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "assign-chemist",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/assign-chemist/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "assign-chemist/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/assign-chemist/AssignChemistForm"
                      )
                    ).default,
                  }),
                },
                // ──────────────────────────────────Perform Testing Routes───────────────────────────────────────────

                {
                  path: "perform-testing",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/perform-testing/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "perform-testing/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/perform-testing/PerformTestDetail"
                      )
                    ).default,
                  }),
                },
                {
                  path: "perform-testing/test-input/:teid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/perform-testing/TestInput"
                      )
                    ).default,
                  }),
                },
                {
                  path: "perform-testing/view-raw-data/:teid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/perform-testing/ViewRawData"
                      )
                    ).default,
                  }),
                },
                {
                  path: "perform-testing/test-documents/:trfid/:tid/:teid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/perform-testing/ViewTestDocuments"
                      )
                    ).default,
                  }),
                },
                {
                  path: "view-draft-report",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/view-draft-report/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "view-draft-report/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/view-draft-report/DraftReportView"
                      )
                    ).default,
                  }),
                },
                {
                  path: "review-by-hod",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/review-by-hod/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "review-by-hod/:tid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/review-by-hod/ReviewByHodDetail"
                      )
                    ).default,
                  }),
                },
                {
                  path: "review-by-qa",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/review-by-qa/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "review-by-qa/:tid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/review-by-qa/ReviewByQaDetail"
                      )
                    ).default,
                  }),
                },
                {
                  // generate-ulr
                  path: "generate-ulr",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/generate-ulr/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "generate-ulr/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/generate-ulr/GenerateUlr"
                      )
                    ).default,
                  }),
                },
                {
                  path: "GenerateUlrDetail/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/generate-ulr/GenerateUlrDetail"
                      )
                    ).default,
                  }),
                },
                {
                  path: "pending-upload-reports",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/pending-upload-reports/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "pending-upload-reports/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/pending-upload-reports/PendingUploadReportDetail"
                      )
                    ).default,
                  }),
                },
                {
                  path: "final-reports-unsigned",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/final-reports-unsigned/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "final-reports-unsigned/view",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/final-reports-unsigned/FinalReportDetail"
                      )
                    ).default,
                  }),
                },
                {
                  path: "signed-reports",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/action-items/signed-reports/index"
                      )
                    ).default,
                  }),
                },
              ],
            },
            {
              path: "approvals",
              children: [
                {
                  path: "priority-approval",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/priority-approval/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "payment-approval-testing",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/payment-approval-testing/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "payment-approval-calibration",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/payment-approval-calibration/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "payment-hold-notification-1",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/payment-hold-notification-1/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "payment-approval-2",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/payment-approval-2/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "witness-approval",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/witness-approval/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "witness-lock",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/witness-lock/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "payment-hold-notification-2",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/payment-hold-notification-2/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-payment-approval-2",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/calibration-payment-approval-2/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "approve-signature",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/approve-signature/index"
                      )
                    ).default,
                  }),
                },
                {
                  path: "ApproveSignatureReport/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/approvals/approve-signature/ApproveSignatureReport"
                      )
                    ).default,
                  }),
                },
              ],
            },
            // =============================sales==========================
            {
              path: "sales",
              children: [
                // ── test-packages ──────────────────────
                {
                  path: "test-packages",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/sales/test-packages")
                    ).default,
                  }),
                },
                {
                  path: "test-packages/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/sales/test-packages/AddTestPackage"
                      )
                    ).default,
                  }),
                },
                {
                  path: "test-packages/edit/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/sales/test-packages/EditTestPackage"
                      )
                    ).default,
                  }),
                },
                // ── Clone route — same EditTestPackage, cloneId param se isClone=true ──
                {
                  path: "test-packages/clone/:cloneId",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/sales/test-packages/EditTestPackage"
                      )
                    ).default,
                  }),
                },
              ],
            },
            // ========================accounts=============================
            {
              path: "accounts",
              children: [
                // ── Payment List + nested routes ──────────────────────
                {
                  path: "payment-list",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/Add"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "link-invoice/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/LinkInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "print-receipt/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/PrintPaymentReceipt"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit-without-customer/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/EditPayment"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "link-bd/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/LinkBD"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "pending-invoices/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/PendingInvoices"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "link-customer/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/payment-list/LinkCustomer"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                // ── Other accounts routes ─────────────────────────────
                {
                  path: "payment-list-party-wise",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/payment-list-party-wise"
                      )
                    ).default,
                  }),
                },
                {
                  path: "customer-payment/:customerid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/payment-list-party-wise/CustomerPayments"
                      )
                    ).default,
                  }),
                },
                {
                  path: "customer-ledger/:customerid",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/payment-list-party-wise/CustomerLedger"
                      )
                    ).default,
                  }),
                },
                {
                  path: "testing-unbilled-items",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/testing-unbilled-items"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-unbilled-items",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/calibration-unbilled-items"
                      )
                    ).default,
                  }),
                },
                {
                  path: "proforma-invoice",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/proforma-invoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "proforma-invoice/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/proforma-invoice/AddEditProformaInvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "proforma-invoice/edit/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/proforma-invoice/AddEditProformaInvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "proforma-invoice/view/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/proforma-invoice/ViewProformaInvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-invoice-list",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/calibration-invoice-list"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-invoice-list/view/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/calibration-invoice-list/ViewCalibrationInvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-invoice-list/edit/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/calibration-invoice-list/Addcalibrationinvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "calibration-invoice-list/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/calibration-invoice-list/Addcalibrationinvoice"
                      )
                    ).default,
                  }),
                },
                {
                  path: "testing-invoices",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/AddTestingInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create-advance",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/AddTestingAdvanceInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "create-foc",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/AddTestingFOCInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/EditTestingInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/ViewInvoiceCalibration"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-detailed/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/ViewDetailedInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view-itemized/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/testing-invoices/ViewItemizedBill"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "past-invoices",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/past-invoices"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/past-invoices/EditPastInvoice"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add-opening-balance",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/past-invoices/AddOpeningBalance"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "canceled-invoices",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/canceled-invoices"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/canceled-invoices/ViewInvoiceCalibration"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "invoice-cancelation-request",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/invoice-cancelation-request"
                      )
                    ).default,
                  }),
                },
                {
                  path: "credit-note",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/credit-note"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/credit-note/AddCreditNote"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "view/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/credit-note/ViewCreditNote"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/credit-note/AddCreditNote"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "link-invoices/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/credit-note/LinkInvoicesToCreditNote"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "invoice-report",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/invoice-report"
                      )
                    ).default,
                  }),
                },
                {
                  path: "complete-ledger",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/complete-ledger"
                      )
                    ).default,
                  }),
                },
                {
                  path: "sales-report",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/accounts/sales-report")
                    ).default,
                  }),
                },
                {
                  path: "gstr-1",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/accounts/gstr-1")
                    ).default,
                  }),
                },
                {
                  path: "igst",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/gstr-1/Igst"
                      )
                    ).default,
                  }),
                },
                {
                  path: "consent-letter",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/consent-letter"
                      )
                    ).default,
                  }),
                },
                {
                  path: "consent-letter/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/consent-letter/AddConsentLetter"
                      )
                    ).default,
                  }),
                },
                {
                  path: "consent-letter/view/:id",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/consent-letter/ViewConsentLetter"
                      )
                    ).default,
                  }),
                },
                {
                  path: "expense-category",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/expense-category"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/expense-category/AddExpenseCategory"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/accounts/expense-category/EditExpenseCategory"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "expenses",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/accounts/expenses")
                    ).default,
                  }),
                },
                {
                  path: "expenses/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/accounts/expenses/AddExpense"
                      )
                    ).default,
                  }),
                },
              ],
            },
            // ========================people=======================
            {
              path: "people",
              children: [
                {
                  path: "customer-types",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/customer-types"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/customer-types/AddCustomerType"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/customer-types/EditCustomerType"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "customer-categories",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/people/customer-categories"
                      )
                    ).default,
                  }),
                },
                {
                  path: "customer-categories/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/people/customer-categories/AddCustomerCategory"
                      )
                    ).default,
                  }),
                },

                {
                  path: "specific-purposes",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/specific-purposes"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/specific-purposes/AddSpecificPurpose"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/specific-purposes/EditSpecificPurpose"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "customers",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/people/customers")
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/customers/AddCustomer"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/customers/EditCustomer"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "promoters",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/people/promoters")
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/promoters/AddPromoter"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/people/promoters/EditPromoter"
                          )
                        ).default,
                      }),
                    },
                  ],
                },

                {
                  path: "suppliers",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/people/suppliers")
                    ).default,
                  }),
                },
                {
                  path: "suppliers/add",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "app/pages/dashboards/people/suppliers/AddSupplier"
                      )
                    ).default,
                  }),
                },

                {
                  path: "users",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/people/users")
                    ).default,
                  }),
                },
                {
                  path: "users/add",
                  lazy: async () => ({
                    Component: (
                      await import("app/pages/dashboards/people/users/AddUser")
                    ).default,
                  }),
                },
              ],
            },
            {
              path: "inventory",
              children: [
                {
                  path: "categories",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/categories"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/categories/AddCategories"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/categories/EditCategories"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "subcategories",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/subcategories"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/subcategories/AddSubCategories"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/inventory/subcategories/EditSubCategories"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },
            {
              path: "hrm",
              children: [
                {
                  path: "manage-branch",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import("app/pages/dashboards/hrm/manage-branch")
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-branch/AddManageBranch"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-branch/EditManageBranch"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "salary-structure-design",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/salary-structure-design"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/salary-structure-design/AddSalaryStructureDesign"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/salary-structure-design/EditSalaryStructureDesign"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "manage-departments",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-departments"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-departments/AddManageDepartment"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-departments/EditManageDepartments"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
                {
                  path: "manage-designations",
                  children: [
                    {
                      path: "",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-designations"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "add",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-designations/AddManageDesignations"
                          )
                        ).default,
                      }),
                    },
                    {
                      path: "edit/:id",
                      lazy: async () => ({
                        Component: (
                          await import(
                            "app/pages/dashboards/hrm/manage-designations/EditManageDesignations"
                          )
                        ).default,
                      }),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (await import("app/pages/settings/sections/General"))
                  .default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
