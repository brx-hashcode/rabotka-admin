import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "#/components/ui/form";
import { otpSchema } from "#/lib/validations/auth";

type Step2OtpFormProps = {
  email: string;
  onSubmit: (data: { otp: string }) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isVerifying: boolean;
  isResending: boolean;
  serverError: string | null;
};

const OTP_LENGTH = 6;
const EMPTY_OTP = new Array<string>(OTP_LENGTH).fill("");
const OTP_INPUT_KEYS = EMPTY_OTP.map((_, i) => `otp-${i}`);
const OTP_CHAR_REGEX = /^\d$/;
const RESEND_COOLDOWN_SECONDS = 60;

const focusInput = (index: number) => {
  document.getElementById(`otp-input-${index}`)?.focus();
};

const isValidOtpChar = (char: string) => OTP_CHAR_REGEX.test(char);

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export function Step2OtpForm({
  email,
  onSubmit,
  onResend,
  onBack,
  isVerifying,
  isResending,
  serverError,
}: Readonly<Step2OtpFormProps>) {
  const [otpValues, setOtpValues] = useState<string[]>([...EMPTY_OTP]);
  const [resendCooldown, setResendCooldown] = useState<number>(RESEND_COOLDOWN_SECONDS);

  const form = useForm<{ otp: string }>({
    resolver: zodResolver(z.object({ otp: otpSchema })),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (serverError) {
      form.setError("otp", { type: "server", message: serverError });
    }
  }, [serverError, form]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const updateOtpValues = useCallback(
    (newValues: string[], fieldOnChange: (value: string) => void) => {
      setOtpValues(newValues);
      fieldOnChange(newValues.join(""));
    },
    [],
  );

  const handleOtpChange = useCallback(
    (index: number, value: string, fieldOnChange: (value: string) => void) => {
      const char = value.slice(-1);
      if (char && isValidOtpChar(char)) {
        const newValues = [...otpValues];
        newValues[index] = char;
        updateOtpValues(newValues, fieldOnChange);
        if (index < OTP_LENGTH - 1) focusInput(index + 1);
      } else if (value === "") {
        const newValues = [...otpValues];
        newValues[index] = "";
        updateOtpValues(newValues, fieldOnChange);
        if (index > 0) focusInput(index - 1);
      }
    },
    [otpValues, updateOtpValues],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otpValues[index] && index > 0) {
        focusInput(index - 1);
      }
    },
    [otpValues],
  );

  const handlePaste = useCallback(
    (
      e: React.ClipboardEvent<HTMLInputElement>,
      fieldOnChange: (value: string) => void,
    ) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
      const isValidPaste = pastedData.split("").every(isValidOtpChar);
      if (!isValidPaste && pastedData) return;
      const newValues = EMPTY_OTP.map((_, i) => pastedData[i] || "");
      updateOtpValues(newValues, fieldOnChange);
      const nextEmptyIndex = newValues.findIndex((val) => !val);
      focusInput(nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex);
    },
    [updateOtpValues],
  );

  const handleResend = useCallback(async () => {
    setOtpValues([...EMPTY_OTP]);
    form.reset();
    await onResend();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setTimeout(() => focusInput(0), 100);
  }, [form, onResend]);

  let resendButtonContent: React.ReactNode;
  if (isResending) {
    resendButtonContent = (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Sending…
      </>
    );
  } else if (resendCooldown > 0) {
    resendButtonContent = `Resend in (${formatTime(resendCooldown)})`;
  } else {
    resendButtonContent = "Resend code";
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Code sent to <span className="font-medium text-foreground">{email}</span>
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex gap-2 justify-center">
                    {otpValues.map((value, index) => (
                      <Input
                        key={OTP_INPUT_KEYS[index]}
                        id={`otp-input-${index}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={value}
                        onChange={(e) =>
                          handleOtpChange(index, e.target.value, field.onChange)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={(e) => handlePaste(e, field.onChange)}
                        disabled={isVerifying || isResending}
                        className="h-11 w-full aspect-square text-center text-lg font-bold"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isVerifying || isResending}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm cursor-pointer"
              onClick={handleResend}
              disabled={isVerifying || isResending || resendCooldown > 0}
            >
              {resendButtonContent}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground cursor-pointer"
              onClick={onBack}
              disabled={isVerifying || isResending}
            >
              Change email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
