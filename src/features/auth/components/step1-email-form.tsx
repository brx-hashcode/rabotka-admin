import { useEffect } from "react";
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
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { emailSchema } from "#/lib/validations/auth";

type Step1EmailFormProps = {
  onSubmit: (data: { email: string }) => Promise<void>;
  isLoading: boolean;
  serverError: string | null;
};

export function Step1EmailForm({
  onSubmit,
  isLoading,
  serverError,
}: Readonly<Step1EmailFormProps>) {
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: emailSchema })),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (serverError) {
      form.setError("email", { type: "server", message: serverError });
    }
  }, [serverError, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="admin@rabotka.com"
                  disabled={isLoading}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send the code"
          )}
        </Button>
      </form>
    </Form>
  );
}
