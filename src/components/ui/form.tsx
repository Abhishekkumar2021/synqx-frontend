"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Controller, useFormContext, FormProvider } from "react-hook-form" // Value imports
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form" // Type-only imports

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------------------------
// Form Provider (Main wrapper for react-hook-form context)
// ---------------------------------------------------------------------------------------------
const ShadcnForm = FormProvider

// ---------------------------------------------------------------------------------------------
// FormItemContext (Used by FormLabel, FormControl, FormMessage to get field info)
// ---------------------------------------------------------------------------------------------
type FormItemContextValue = {
  id: string
  name: FieldPath<FieldValues> // Add name to context
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// ---------------------------------------------------------------------------------------------
// FormItem (Wrapper for each form field group)
// ---------------------------------------------------------------------------------------------
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id, name: "" as FieldPath<FieldValues> }}> {/* name is set by FormField */}
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

// ---------------------------------------------------------------------------------------------
// FormLabel (Label for the form field)
// ---------------------------------------------------------------------------------------------
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// ---------------------------------------------------------------------------------------------
// FormControl (Wrapper for the actual input component)
// ---------------------------------------------------------------------------------------------
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !formMessageId
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!useFormField().error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

// ---------------------------------------------------------------------------------------------
// FormDescription (Help text for the form field)
// ---------------------------------------------------------------------------------------------
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

// ---------------------------------------------------------------------------------------------
// FormMessage (Error message for the form field)
// ---------------------------------------------------------------------------------------------
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// ---------------------------------------------------------------------------------------------
// useFormField Hook (To be used by consumers of FormItemContext)
// ---------------------------------------------------------------------------------------------
function useFormField() {
  const { getFieldState, formState } = useFormContext()
  const itemContext = React.useContext(FormItemContext)
  const { id, name } = itemContext

  if (!name) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const fieldState = getFieldState(name, formState)

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// ---------------------------------------------------------------------------------------------
// FormField (The actual component that wraps Controller and sets FormItemContext)
// This definition is closer to shadcn's reference.
// ---------------------------------------------------------------------------------------------
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: ControllerProps<TFieldValues, TName>
) => {
  const id = React.useId() 
  return (
    <FormItemContext.Provider value={{ id, name: props.name }}>
      <Controller {...props} />
    </FormItemContext.Provider>
  )
}


export {
  ShadcnForm as Form, // Export FormProvider as Form
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}