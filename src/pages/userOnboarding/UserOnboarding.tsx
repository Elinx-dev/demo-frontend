import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";
import {
  createUserOnboardingSchema,
  type UserOnboardingForm,
} from "./userOnboardingSchema";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";

import { Button } from "@/ui/primitives/Button/Button";
import { FileInput } from "@/ui/primitives/FileInput/Fileinput";
import { Card } from "@/ui/primitives/Card/Card";
import Title from "@/ui/primitives/Title/Title";
import { usePermission } from "@/hooks/usePermissions";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import {
  getUploadedFileUrl,
  uploadFile,
} from "@/services/fileUpload/FileUpload";
import { useToast } from "@/ui/feedback/toast/useToast";
import { useActiveProfile } from "@/context/ProfileContext";
import UserPermissionsModal from "./UserPermissionModal";

const UserOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { accountCenterUserId } = useParams();
  const isEditMode = Boolean(accountCenterUserId);

  const { can } = usePermission();

  const designation = {
    ...(can("USER_CREATE_MANAGER") && { 1: "Manager" }),
    ...(can("USER_CREATE_ANALYST") && { 2: "Analyst" }),
  };

  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [newlyCreatedAuthUserId, setNewlyCreatedAuthUserId] = useState<
    number | null
  >(null);
  const [newlyCreatedUserName, setNewlyCreatedUserName] = useState<string>("");
  const profileStore = sessionStorage.getItem("ipc_post_login_bootstrap");

  const profileData = profileStore
    ? JSON.parse(profileStore)?.profileContext?.activeProfiles
    : null;
  console.log("profileData", profileData);

  const activeProfile = useActiveProfile();

  const authSession = JSON.parse(localStorage.getItem("auth.session") || "{}");

  const tenantProfileId =
    activeProfile.profileId > 0 ? activeProfile.profileId : null;

  // The owner's auth_user_id - used as assignedBy when creating/editing a manager.
  // This must be the auth_user_id of the person doing the assignment (the owner),
  // NOT the tenant_profile_id. Storing tenant_profile_id here was the root cause
  // of managers seeing zero portfolio data.
  const ownerAuthUserId: number =
    Number(
      JSON.parse(sessionStorage.getItem("ipc_post_login_bootstrap") || "{}")
        ?.identity?.authUserId,
    ) ||
    Number(authSession?.value?.authUserId) ||
    0;

  const userProfile = authSession?.value;

  // EMAIL VALIDATION STATES
  const [isCheckingEmailAvailability, setIsCheckingEmailAvailability] =
    useState(false);

  const [emailAvailabilityChecked, setEmailAvailabilityChecked] =
    useState(false);

  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const [emailAvailabilityText, setEmailAvailabilityText] = useState("");

  const [isCheckingMobileAvailability, setIsCheckingMobileAvailability] =
    useState(false);

  const [mobileAvailabilityChecked, setMobileAvailabilityChecked] =
    useState(false);

  const [mobileAvailable, setMobileAvailable] = useState<boolean | null>(null);

  const [mobileAvailabilityText, setMobileAvailabilityText] = useState("");

  const toast = useToast();
  const [selectedProfiles, setSelectedProfiles] = useState<any[]>([]);

  console.log("selectedProfiles", selectedProfiles);
  const [showPassword, setShowPassword] = useState(false);

  const tenantProfileIds = selectedProfiles.map(
    (profile: any) => profile.tenantProfileId,
  );
  console.log("tenantProfileIds", tenantProfileIds);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    register,
    trigger,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserOnboardingForm>({
    mode: "onBlur",
    resolver: zodResolver(createUserOnboardingSchema(isEditMode)),
    defaultValues: {
      tenantProfileIds: tenantProfileIds ?? [],
      tenantId: userProfile?.tenantId,
      assignedBy: ownerAuthUserId ?? 0, // owner's auth_user_id, NOT tenantProfileId
      isActive: true,

      authUserName: "",
      appUserName: "",
      designation: "",
      notes: "",
      password: "",
      roleId: userProfile?.roleId,
      profile: {
        fullName: "",
        whatsappNumber: "",
        profileImageUrl: "",
      },
    },
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  // EMAIL VALIDATION

  const validateRegistrationId = async (value: string, type: 1 | 2) => {
    const res: any = await apiService.post("idam/create_registration_otp", {
      regitrationIdTypeId: type,
      userRegistrationId: value,
      validateOnly: true,
    });

    return res?.data;
  };
  const handleEmailBlur = async (email: string) => {
    if (!email || accountCenterUserId) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // RESET STATES
    setEmailAvailabilityChecked(false);
    setEmailAvailable(null);
    setEmailAvailabilityText("");

    // EMAIL FORMAT VALIDATION
    if (!emailRegex.test(email)) {
      setEmailAvailable(false);
      setEmailAvailabilityChecked(true);
      setEmailAvailabilityText("Enter valid email");

      return;
    }

    setIsCheckingEmailAvailability(true);

    try {
      const result = await validateRegistrationId(email, 1);

      const status = result?.status;
      const message = result?.message;
      const available = result?.data?.available;

      setEmailAvailabilityChecked(true);

      // EMAIL EXISTS
      if (status === "error" || message === "Email is already registered") {
        setEmailAvailable(false);
        setEmailAvailabilityText("Email already exists");
      }

      // EMAIL AVAILABLE
      else if (status === "success" && available === true) {
        setEmailAvailable(true);
        setEmailAvailabilityText("Email available");
      }

      // FALLBACK
      else {
        setEmailAvailable(false);
        setEmailAvailabilityText("Validation failed");
      }
    } catch (error) {
      console.error("EMAIL VALIDATION ERROR", error);

      setEmailAvailabilityChecked(true);
      setEmailAvailable(false);
      setEmailAvailabilityText("Validation failed");
    } finally {
      setIsCheckingEmailAvailability(false);
    }
  };
  const handleMobileBlur = async (mobile: string) => {
    if (!mobile || accountCenterUserId) return;

    // Trigger Zod validation first
    const isValid = await trigger("profile.whatsappNumber");

    if (!isValid) {
      return;
    }

    setIsCheckingMobileAvailability(true);

    try {
      const result = await validateRegistrationId(mobile, 2);

      const status = result?.status;
      const message = result?.message;
      const available = result?.data?.available;

      setMobileAvailabilityChecked(true);

      if (
        status === "error" ||
        message === "Mobile number is already registered"
      ) {
        setMobileAvailable(false);
        setMobileAvailabilityText("Mobile already exists");
      } else if (status === "success" && available === true) {
        setMobileAvailable(true);
        setMobileAvailabilityText("Mobile available");
      }
    } finally {
      setIsCheckingMobileAvailability(false);
    }
  };
  useEffect(() => {
    if (!accountCenterUserId) return;

    // Helper: match profile IDs from user data against available profileData
    const autoPopulateProfiles = (userData: any) => {
      const raw = userData?.tenantProfileIds ?? userData?.tenantProfileId ?? [];
      const ids: number[] = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

      if (ids.length > 0 && profileData) {
        const matched = profileData.filter((p: any) =>
          ids.includes(p.tenantProfileId),
        );
        if (matched.length > 0) {
          setSelectedProfiles(matched);
          setValue(
            "tenantProfileIds",
            matched.map((p: any) => p.tenantProfileId),
          );
        }
      }
    };

    const fetchUser = async () => {
      try {
        const navigationState = location.state as { user?: any };

        if (navigationState?.user) {
          const userData = navigationState.user;
          setNewlyCreatedAuthUserId(userData?.authUserId ?? null);
          setNewlyCreatedUserName(
            userData?.profile?.fullName || userData?.authUserName || "",
          );
          reset({
            tenantProfileIds: userData?.tenantProfileIds || tenantProfileIds,
            tenantId: userData?.tenantId || userProfile?.tenantId,
            assignedBy: userData?.assignedBy || ownerAuthUserId, // owner auth_user_id, not tenantProfileId
            authUserName: userData?.authUserName || "",
            // whatsappNumber: userData?.whatsappNumber || "",
            appUserName: userData?.appUserName || "",
            designation: userData?.designation || "",
            notes: userData?.notes || "",
            password: "",
            roleId: userData?.roleId || userProfile?.roleId,
            isActive: userData?.isActive ?? true,
          });

          setValue("profile.fullName", userData?.profile?.fullName || "");

          setValue(
            "profile.whatsappNumber",
            userData?.profile?.whatsappNumber || "",
          );

          setValue(
            "profile.profileImageUrl",
            userData?.profile?.profileImageUrl || "",
          );

          // Auto-populate selected profiles from navigation state data
          autoPopulateProfiles(userData);

          // If no profile IDs found in navigation state, also fetch from API
          const rawIds =
            userData?.tenantProfileIds ?? userData?.tenantProfileId;
          if (!rawIds || (Array.isArray(rawIds) && rawIds.length === 0)) {
            try {
              const res: any = await apiService.post(
                `idam/get_account_center_user_by_id`,
                { accountCenterUserId },
              );
              const apiUserData = res?.data?.data;
              if (apiUserData) {
                autoPopulateProfiles(apiUserData);
              }
            } catch (err) {
              console.warn("Could not fetch profile assignments from API", err);
            }
          }
        } else {
          const res: any = await apiService.post(
            `idam/get_account_center_user_by_id`,
            {
              accountCenterUserId,
            },
          );

          const userData = res?.data?.data;
          console.log("userData", userData);

          if (userData) {
            reset({
              tenantProfileIds: userData?.tenantProfileIds || tenantProfileIds,
              tenantId: userData?.tenantId || userProfile?.tenantId,
              assignedBy: userData?.assignedBy || ownerAuthUserId, // owner auth_user_id, not tenantProfileId
              authUserName: userData?.authUserName || "",
              appUserName: userData?.appUserName || "",
              designation: userData?.designation || "",
              notes: userData?.notes || "",
              password: "",
              roleId: userData?.roleId || userProfile?.roleId,
            });

            setValue("profile.fullName", userData?.profile?.fullName || "");

            setValue(
              "profile.whatsappNumber",
              userData?.profile?.whatsappNumber || "",
            );

            setValue(
              "profile.profileImageUrl",
              userData?.profile?.profileImageUrl || "",
            );

            // Auto-populate selected profiles from API data
            autoPopulateProfiles(userData);
          }
        }
      } catch (error) {
        console.error("Fetch User Error", error);
      }
    };

    fetchUser();
  }, [
    accountCenterUserId,
    location.state,
    tenantProfileId,
    userProfile?.tenantId,
    userProfile?.roleId,
    reset,
    setValue,
  ]);

  const handleProfileUpload = (file: File | null) => {
    setValue("profile.profileImageUrl", file, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: UserOnboardingForm) => {
    console.log("Form Data", data);
    // BLOCK DUPLICATE EMAIL
    if (emailAvailable === false) {
      toast.error("Email already exists");
      return;
    }
    if (mobileAvailable === false) {
      toast.error("Mobile already exists");
      return;
    }

    try {
      let uploadedImageUrl = "";

      if (
        data.profile.profileImageUrl &&
        data.profile.profileImageUrl instanceof File
      ) {
        const result = await uploadFile(data.profile.profileImageUrl);
        uploadedImageUrl = getUploadedFileUrl(result);
      }

      const payload = {
        tenantProfileId: tenantProfileIds,
        tenantId: userProfile?.tenantId ?? data.tenantId,
        roleId: data.roleId || userProfile?.roleId,
        authUserName: data.authUserName,
        appUserName: data.appUserName,
        designation: data.designation,
        notes: data.notes,
        assignedBy: ownerAuthUserId ?? 0, // owner auth_user_id, not tenantProfileId

        profile: {
          fullName: data.profile.fullName,
          whatsappNumber: data.profile.whatsappNumber,

          profileImageUrl:
            uploadedImageUrl ||
            (typeof data.profile.profileImageUrl === "string"
              ? data.profile.profileImageUrl
              : ""),
        },
      };

      let res: any;

      // UPDATE
      if (accountCenterUserId) {
        const updatePayload = {
          accountCenterUserId: Number(accountCenterUserId),

          tenantProfileId: tenantProfileIds ?? data.tenantProfileIds,
          tenantId: userProfile?.tenantId ?? data.tenantId,

          updatedBy: tenantProfileId || 1,

          roleId: data.roleId || userProfile?.roleId,
          isActive: data.isActive,
          authUserName: data.authUserName,
          appUserName: data.appUserName,
          designation: data.designation,
          notes: data.notes,

          profile: {
            fullName: data.profile.fullName,
            whatsappNumber: data.profile.whatsappNumber,

            profileImageUrl:
              uploadedImageUrl ||
              (typeof data.profile.profileImageUrl === "string"
                ? data.profile.profileImageUrl
                : ""),
          },
        };

        res = await apiService.post(
          `idam/update_account_center_user`,
          updatePayload,
        );
      }

      // CREATE
      else {
        const createPayload = {
          ...payload,
          password: data.password,
        };

        res = await apiService.post(
          "idam/assign_account_center_user",
          createPayload,
        );

        const createdAuthUserId =
          res?.data?.data?.authUserId ?? res?.data?.authUserId;

        if (createdAuthUserId) {
          toast.success(
            res?.data?.data?.message ||
              res?.data?.message ||
              "User created successfully",
          );
          setNewlyCreatedAuthUserId(createdAuthUserId);
          setNewlyCreatedUserName(data.profile.fullName || data.authUserName);
          setPermissionsOpen(true);
          return;
        }
      }

      const successMessage =
        res?.data?.message ||
        res?.data?.data?.message ||
        (accountCenterUserId
          ? "User updated successfully"
          : "User created successfully");

      toast.success(successMessage);
      setTimeout(() => navigate(-1), 1500);
    } catch (error: any) {
      console.error("Error ❌", error);

      const errorMessage =
        error?.response?.data?.message ||
        (accountCenterUserId
          ? "Failed to update user"
          : "Failed to create user");

      toast.error(errorMessage);
    }
  };

  const profileImage = watch("profile.profileImageUrl");

  const previewUrl =
    profileImage instanceof File
      ? URL.createObjectURL(profileImage)
      : typeof profileImage === "string" && profileImage
        ? profileImage
        : null;

  return (
    <div className="w-full p-2">
      <Card>
        <Title as="h3" className="mb-6 flex items-center gap-3 text-gray-800">
          <span className="font-semibold tracking-tight">
            {accountCenterUserId ? "Edit User" : "User Onboarding"}
          </span>
        </Title>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          {/* EMAIL */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Email Address *
              </label>

              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  emailAvailable === true
                    ? "text-green-600"
                    : emailAvailable === false
                      ? "text-red-500"
                      : "text-gray-400"
                }`}
              >
                {isEditMode
                  ? "Locked"
                  : isCheckingEmailAvailability
                    ? "Checking..."
                    : emailAvailabilityChecked
                      ? emailAvailable
                        ? "Available"
                        : "Already Exists"
                      : "Not Checked"}
              </span>
            </div>

            <div className="relative">
              <input
                {...register("authUserName")}
                readOnly={isEditMode}
                aria-disabled={isEditMode}
                placeholder="Enter email address"
                onBlur={(e) => {
                  handleEmailBlur(e.target.value);
                }}
                className={`
                  w-full rounded-xl border px-4 py-3 pr-11
                  text-sm shadow-sm transition-all duration-200
                  focus:outline-none focus:ring-2

                  ${
                    isEditMode
                      ? "cursor-not-allowed bg-gray-100 text-gray-500"
                      : ""
                  }

                  ${
                    emailAvailable === false
                      ? "border-red-400 focus:ring-red-200"
                      : emailAvailable === true
                        ? "border-green-400 focus:ring-green-200"
                        : "border-gray-300 focus:ring-blue-200"
                  }
                `}
              />

              {/* RIGHT ICON */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingEmailAvailability ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : emailAvailable === true ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : emailAvailable === false ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>

            {/* STATUS MESSAGE */}
            <p
              className={`mt-1 text-xs font-medium ${
                emailAvailable === true
                  ? "text-green-600"
                  : emailAvailable === false
                    ? "text-red-500"
                    : "text-gray-400"
              }`}
            >
              {emailAvailabilityText}
            </p>

            {/* FORM ERROR */}
            {errors.authUserName?.message && (
              <span className="mt-1 block text-sm text-red-500">
                {errors.authUserName?.message}
              </span>
            )}
          </div>
          {/* PASSWORD */}
          <div className={isEditMode ? "hidden" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={
                  accountCenterUserId
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                className="
        w-full px-3 py-2 pr-12
        border border-gray-300
        rounded-md
        focus:outline-none
        focus:ring-2 focus:ring-blue-500
      "
              />

              {/* Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-gray-500
        hover:text-gray-700
      "
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {errors.password?.message && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.password?.message}
              </span>
            )}
          </div>

          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Name *
            </label>

            <input
              {...register("profile.fullName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.profile?.fullName?.message && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.profile?.fullName?.message}
              </span>
            )}
          </div>

          {/* DESIGNATION */}
          <div className={isEditMode ? "hidden" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation *
            </label>

            <select
              {...register("designation")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Designation</option>

              {Object.entries(designation).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {errors.designation?.message && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.designation.message}
              </span>
            )}
          </div>

          {/* WHATSAPP */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">
                WhatsApp Number *
              </label>

              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  mobileAvailable === true
                    ? "text-green-600"
                    : mobileAvailable === false
                      ? "text-red-500"
                      : "text-gray-400"
                }`}
              >
                {isEditMode
                  ? "Locked"
                  : isCheckingMobileAvailability
                    ? "Checking..."
                    : mobileAvailabilityChecked
                      ? mobileAvailable
                        ? "Available"
                        : "Already Exists"
                      : "Not Checked"}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                {...register("profile.whatsappNumber")}
                placeholder="Enter WhatsApp number"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(
                    /\D/g,
                    "",
                  );
                }}
                onBlur={(e) => {
                  handleMobileBlur(e.target.value);
                }}
                className={`
    w-full rounded-xl border px-4 py-3 pr-11
    text-sm shadow-sm transition-all duration-200
    focus:outline-none focus:ring-2
  `}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingMobileAvailability ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : mobileAvailable === true ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : mobileAvailable === false ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>

            <p
              className={`mt-1 text-xs font-medium ${
                mobileAvailable === true
                  ? "text-green-600"
                  : mobileAvailable === false
                    ? "text-red-500"
                    : "text-gray-400"
              }`}
            >
              {mobileAvailabilityText}
            </p>

            {errors.profile?.whatsappNumber?.message && (
              <span className="mt-1 block text-sm text-red-500">
                {errors.profile?.whatsappNumber?.message}
              </span>
            )}
          </div>

          {/* IMAGE */}
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* LEFT SIDE - IMAGE UPLOAD */}
            <div className="space-y-4 rounded-xl border p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">
                Profile Image
              </h3>

              {previewUrl && (
                <div className="w-32 h-32 overflow-hidden rounded-xl border shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <FileInput
                label="Upload Image"
                accept="image/*"
                showPreview
                allowClear
                onChange={(file) => handleProfileUpload(file as File)}
              />
            </div>

            {/* RIGHT SIDE - PROFILE DROPDOWN */}
            <div ref={dropdownRef} className="relative w-full">
              <label className="block mb-2 text-sm font-semibold">
                Select Profiles *
              </label>

              {/* Trigger */}
              <div
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="
      min-h-[50px]
      border
      rounded-xl
      px-4 py-3
      bg-white
      cursor-pointer
      flex
      items-center
      justify-between
      gap-3
    "
              >
                <div className="flex flex-wrap gap-2 flex-1">
                  {selectedProfiles.length > 0 ? (
                    selectedProfiles.map((profile) => (
                      <div
                        key={profile.tenantProfileId}
                        className="
              flex items-center gap-2
              bg-blue-100
              rounded-full
              px-3 py-1
            "
                      >
                        <img
                          src={profile.imageUrl || "/default-profile.png"}
                          alt=""
                          className="
                w-6 h-6
                rounded-full
                object-cover
              "
                        />

                        <span className="text-sm">{profile.profileName}</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const updated = selectedProfiles.filter(
                              (p) =>
                                p.tenantProfileId !== profile.tenantProfileId,
                            );

                            setSelectedProfiles(updated);

                            setValue(
                              "tenantProfileIds",
                              updated.map((x) => x.tenantProfileId),
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              },
                            );
                          }}
                          className="text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">Select Profiles</span>
                  )}
                </div>

                {/* Arrow */}
                <div>
                  {isDropdownOpen ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div
                  className="
        absolute
        z-50
        w-full
        mt-2
        bg-white
        border
        rounded-xl
        shadow-xl
        max-h-[300px]
        overflow-y-auto
      "
                >
                  {profileData?.map((item: any) => {
                    const isSelected = selectedProfiles.some(
                      (p) => p.tenantProfileId === item.tenantProfileId,
                    );

                    return (
                      <div
                        key={item.tenantProfileId}
                        onClick={() => {
                          const updated = isSelected
                            ? selectedProfiles.filter(
                                (p) =>
                                  p.tenantProfileId !== item.tenantProfileId,
                              )
                            : [...selectedProfiles, item];

                          setSelectedProfiles(updated);

                          setValue(
                            "tenantProfileIds",
                            updated.map((x) => x.tenantProfileId),
                          );
                        }}
                        className={`
              flex items-center gap-3
              p-4
              cursor-pointer
              hover:bg-blue-50
              transition
              ${isSelected ? "bg-blue-100" : ""}
            `}
                      >
                        <input type="checkbox" checked={isSelected} readOnly />

                        <img
                          src={item.imageUrl || "/default-profile.png"}
                          alt={item.profileName}
                          className="
                w-10 h-10
                rounded-full
                object-cover
              "
                        />

                        <div className="flex-1">
                          <p className="font-medium">{item.profileName}</p>

                          <p className="text-sm text-gray-500">
                            {item.tenantProfileTypeDisplayName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.tenantProfileIds?.message && (
                <span className="text-red-500 text-sm mt-1 block">
                  {errors.tenantProfileIds.message}
                </span>
              )}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-between items-center mt-6 col-span-2">
            <div>
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>

                  <button
                    type="button"
                    onClick={() => setValue("isActive", !watch("isActive"))}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300
        ${watch("isActive") ? "bg-green-500" : "bg-red-500"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
          ${watch("isActive") ? "translate-x-8" : "translate-x-1"}`}
                    />
                  </button>

                  <span
                    className={`ml-3 text-sm font-medium ${
                      watch("isActive") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {watch("isActive") ? "Active" : "Inactive"}
                  </span>
                </div>
              )}
            </div>
            <div className="col-span-2 mt-6 flex gap-3">
              <Button
                type="submit"
                variant="primary"
                className="min-w-30 cursor-pointer"
              >
                {isSubmitting
                  ? accountCenterUserId
                    ? "Updating..."
                    : "Creating..."
                  : accountCenterUserId
                    ? "Update User"
                    : "Assign User"}
              </Button>
              {/* {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setNewlyCreatedAuthUserId(
                      Number(
                        JSON.parse(
                          sessionStorage.getItem("ipc_post_login_bootstrap") ||
                            "{}",
                        )?.identity?.authUserId,
                      ) || 0,
                    );
                    setNewlyCreatedUserName(
                      watch("profile.fullName") || watch("authUserName"),
                    );
                    setPermissionsOpen(true);
                  }}
                >
                  <ShieldCheck size={15} className="text-emerald-600" />
                  Permissions
                </Button>
              )} */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {permissionsOpen && newlyCreatedAuthUserId && (
        <UserPermissionsModal
          isOpen={permissionsOpen}
          onClose={() => {
            setPermissionsOpen(false);
            setNewlyCreatedAuthUserId(null);
            if (!isEditMode) {
              navigate(-1);
            }
          }}
          authUserId={newlyCreatedAuthUserId}
          grantedBy={ownerAuthUserId}
          userName={newlyCreatedUserName}
          roleName={watch("designation")}
        />
      )}
    </div>
  );
};

export default UserOnboarding;