/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useDynamicFieldData } from "@/hooks/useDynamicFieldData";
import { validateFieldPattern } from "@/lib/validations";

interface Option {
  id: number | string;
  name: string;
  value?: string | number;
  label?: string;
}

interface FormFieldData {
  name: string;
  label: string;
  type: string;
  sourceData?: string;
  sourceDataType?: string;
  provider?: string | null;
  targetField?: string | null;
  required?: boolean;
  fieldPlaceholder?: string;
  fieldMaxSize?: number;
  fieldMinSize?: number;
  defaultValue?: string;
  isReadOnly?: boolean;
  pattern?: string | null;
  format?: string;
}

interface FormFieldProps {
  field: FormFieldData;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  dependencies?: Record<string, any>; // Valores de outros campos para dependências
  isPublic?: boolean;
}

// Estado global para campos dependentes (ex: brand -> model)
const globalFieldState: Record<string, { id: number | string | null; name: string }> = {};
const globalListeners: Record<string, Set<() => void>> = {};

const subscribeToField = (fieldName: string, callback: () => void) => {
  if (!globalListeners[fieldName]) {
    globalListeners[fieldName] = new Set();
  }
  globalListeners[fieldName].add(callback);
};

const unsubscribeFromField = (fieldName: string, callback: () => void) => {
  if (globalListeners[fieldName]) {
    globalListeners[fieldName].delete(callback);
  }
};

const notifyFieldChange = (fieldName: string) => {
  if (globalListeners[fieldName]) {
    globalListeners[fieldName].forEach((callback) => callback());
  }
};

export default function DynamicFormField({
  field,
  value,
  onChange,
  error,
  dependencies = {},
  isPublic = false,
}: FormFieldProps) {
  const [filter, setFilter] = useState(value || "");
  const [showOptions, setShowOptions] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [dateError, setDateError] = useState("");
  const [patternError, setPatternError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserTypingRef = useRef(false);

  // Carrega dados dinâmicos do campo
  const { options, loading, error: dataError } = useDynamicFieldData(
    {
      name: field.name,
      sourceData: field.sourceData,
      sourceDataType: field.sourceDataType,
      provider: field.provider,
      targetField: field.targetField,
      defaultValue: field.defaultValue,
      isReadOnly: field.isReadOnly,
    },
    dependencies
  );

  // Atualiza filtro quando value muda externamente (não quando o usuário está digitando)
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setFilter(value || "");
    }
    isUserTypingRef.current = false;
  }, [value]);

  // Atualiza estado global quando valor muda (para campos que são dependências)
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => opt.name === value || opt.value === value);
      if (option) {
        globalFieldState[field.name] = {
          id: option.id,
          name: option.name,
        };
        notifyFieldChange(field.name);
      }
    }
  }, [value, options, field.name]);

  // Se campo é hidden, não renderiza
  if (field.type === "hidden") {
    return (
      <input
        type="hidden"
        name={field.name}
        value={value || field.defaultValue || ""}
      />
    );
  }

  // Validação de padrão usando funções específicas para NIF e telefone
  const validatePattern = (val: string): boolean => {
    // Se o valor está vazio, não valida (validação de required é separada)
    if (!val || val.trim() === "") {
      setPatternError("");
      return true;
    }
    
    // Valida sempre se tem pattern OU se é campo conhecido (NIF/telefone)
    const isNIFOrPhone = field.name.toLowerCase() === "nif" || 
                        field.name.toLowerCase() === "mobiles" ||
                        field.name.toLowerCase() === "telefone" ||
                        field.name.toLowerCase() === "phone" ||
                        field.name.toLowerCase() === "mobile";
    
    if (field.pattern || isNIFOrPhone) {
      const validation = validateFieldPattern(val, field.pattern, field.name);
      if (!validation.isValid) {
        setPatternError(validation.error || "Valor inválido");
        return false;
      }
    }
    
    setPatternError("");
    return true;
  };

  const handleChange = (newValue: string) => {
    // Sempre permite mudar o valor, a validação será feita no submit ou onBlur
    onChange(newValue);
  };

  // Determina se o campo deve ser readonly
  // Apenas se explicitamente marcado como readonly
  const isFieldReadOnly = field.isReadOnly === true && !isPublic;

  // Renderiza campo baseado no tipo
  const renderField = () => {
    // Campo de texto padrão
    if (field.type === "text" || !field.type) {
      return (
        <div>
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={value || ""}
            placeholder={field.fieldPlaceholder}
            onChange={(e) => {
              const newValue = e.target.value;
              handleChange(newValue);
              // Limpa erro ao digitar
              if (patternError) {
                setPatternError("");
              }
            }}
            onBlur={(e) => {
              // Valida padrão quando o campo perde o foco
              if (e.target.value) {
                validatePattern(e.target.value);
              } else {
                setPatternError("");
              }
            }}
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
              error || patternError ? "border-red-500" : "border-gray-300"
            } bg-white`}
            required={field.required}
            readOnly={isFieldReadOnly}
            maxLength={field.fieldMaxSize}
            minLength={field.fieldMinSize}
          />
          {patternError && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{patternError}</p>
          )}
        </div>
      );
    }

    // Campo numérico
    if (field.type === "number") {
      // Para NIF e telefone, usa input text para melhor controle
      const isNIFOrPhone = field.name.toLowerCase() === "nif" || 
                          field.name.toLowerCase() === "mobiles" ||
                          field.name.toLowerCase() === "telefone" ||
                          field.name.toLowerCase() === "phone" ||
                          field.name.toLowerCase() === "mobile";
      
      if (isNIFOrPhone) {
        return (
          <div>
            <input
              id={field.name}
              name={field.name}
              type="text"
              inputMode="numeric"
              value={value || ""}
              placeholder={field.fieldPlaceholder}
              onChange={(e) => {
                // Permite apenas números
                const newValue = e.target.value.replace(/\D/g, "");
                handleChange(newValue);
                // Limpa erro ao digitar
                if (patternError) {
                  setPatternError("");
                }
              }}
              onBlur={(e) => {
                // Valida quando perde o foco
                if (e.target.value) {
                  validatePattern(e.target.value);
                } else {
                  setPatternError("");
                }
              }}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
                error || patternError ? "border-red-500" : "border-gray-300"
              } bg-white`}
              required={field.required}
              readOnly={isFieldReadOnly}
              maxLength={field.fieldMaxSize || (field.name.toLowerCase() === "nif" ? 9 : 9)}
              minLength={field.fieldMinSize || (field.name.toLowerCase() === "nif" ? 9 : 7)}
            />
            {patternError && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{patternError}</p>
            )}
          </div>
        );
      }
      
      return (
        <input
          id={field.name}
          name={field.name}
          type="number"
          value={value || ""}
          placeholder={field.fieldPlaceholder}
          onChange={(e) => {
            const newValue = e.target.value;
            handleChange(newValue);
          }}
          onBlur={(e) => {
            // Valida padrão quando perde o foco
            if (field.pattern && e.target.value) {
              validatePattern(e.target.value);
            } else {
              setPatternError("");
            }
          }}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
            error || patternError ? "border-red-500" : "border-gray-300"
          } bg-white`}
          required={field.required}
          readOnly={isFieldReadOnly}
          max={field.fieldMaxSize}
          min={field.fieldMinSize}
        />
      );
    }

    // Campo de email
    if (field.type === "email") {
      return (
        <div>
          <input
            id={field.name}
            name={field.name}
            type="email"
            value={value || ""}
            placeholder={field.fieldPlaceholder || "exemplo@email.com"}
            onChange={(e) => {
              const emailValue = e.target.value;
              handleChange(emailValue);
              if (emailValue && emailValue.trim() !== "") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailValue)) {
                  setEmailError("Por favor, insira um email válido");
                } else {
                  setEmailError("");
                }
              } else {
                setEmailError("");
              }
            }}
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
              emailError || error ? "border-red-500" : "border-gray-300"
            } bg-white`}
            required={field.required}
            readOnly={isFieldReadOnly}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
      );
    }

    // Campo de data
    if (field.type === "date") {
      return (
        <div>
          <input
            id={field.name}
            name={field.name}
            type="date"
            value={value}
            onChange={(e) => {
              const selectedDate = e.target.value;
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (selectedDate) {
                const date = new Date(selectedDate);
                date.setHours(0, 0, 0, 0);

                // Validação básica: data não pode ser futura (exceto para alguns campos)
                if (date > today && field.name !== "licenseDate") {
                  setDateError("A data não pode ser futura");
                  return;
                }

                setDateError("");
              }
              handleChange(selectedDate);
            }}
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
              dateError || error ? "border-red-500" : "border-gray-300"
            }`}
            required={field.required}
            max={new Date().toISOString().split("T")[0]}
          />
          {dateError && (
            <p className="text-red-500 text-sm mt-1">{dateError}</p>
          )}
        </div>
      );
    }

    // Campo select
    if (field.type === "select") {
      // Se tem dependência e não está preenchida, desabilita
      const isDisabled = field.targetField && !dependencies[field.targetField];

      if (loading) {
        return (
          <div className="p-2 border rounded-md bg-blue-50 text-blue-600 border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Carregando opções...
            </div>
          </div>
        );
      }

      if (dataError) {
        return (
          <div className="text-gray-600 bg-gray-50 p-2 border border-gray-300 rounded-md text-sm">
            {dataError}
          </div>
        );
      }

      // Encontra a opção selecionada
      const selectedOption = value 
        ? options.find((opt) => 
            String(opt.value) === String(value) || 
            String(opt.name) === String(value) ||
            String(opt.id) === String(value)
          )
        : null;

      return (
        <Select
          id={field.name}
          name={field.name}
          value={selectedOption ? {
            value: String(selectedOption.value || selectedOption.name),
            label: selectedOption.label || selectedOption.name || String(selectedOption.value)
          } : null}
          onChange={(selectedOption) => {
            if (selectedOption) {
              // Usa o value se disponível, senão usa o label
              const newValue = selectedOption.value || selectedOption.label || "";
              handleChange(String(newValue));
            } else {
              handleChange("");
            }
          }}
          options={options.map((opt) => ({
            value: String(opt.value || opt.name || opt.id),
            label: opt.label || opt.name || String(opt.value || opt.id),
          }))}
          className={`react-select-container text-gray-500 ${
            error ? "react-select--error" : ""
          }`}
          classNamePrefix="react-select"
          placeholder={isDisabled ? "Selecione primeiro o campo dependente" : (field.fieldPlaceholder || "Selecione uma opção")}
          isClearable
          isDisabled={isDisabled || loading}
          noOptionsMessage={() => options.length === 0 ? "Nenhuma opção disponível" : "Nenhuma opção encontrada"}
          required={field.required}
        />
      );
    }

    // Campo auto-complete
    if (field.type === "auto-complete") {
      const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(filter.toLowerCase())
      );

      if (loading) {
        return (
          <div className="p-2 border rounded-md bg-blue-50 text-blue-600 border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Carregando opções...
            </div>
          </div>
        );
      }

      if (dataError) {
        return (
          <div className="text-gray-600 bg-gray-50 p-2 border border-gray-300 rounded-md text-sm">
            {dataError}
          </div>
        );
      }

      return (
        <div className="relative" ref={containerRef}>
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={filter}
            placeholder={field.fieldPlaceholder || "Digite para buscar..."}
            onChange={(e) => {
              setFilter(e.target.value);
              handleChange(e.target.value);
              setShowOptions(true);
            }}
            onFocus={() => setShowOptions(true)}
            onBlur={() => setTimeout(() => setShowOptions(false), 200)}
            autoComplete="off"
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
              error || patternError ? "border-red-500" : "border-gray-300"
            } bg-white`}
            required={field.required}
          />
          {showOptions && filteredOptions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-md w-full max-h-40 overflow-auto mt-1 shadow-lg">
              {filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  className="px-4 py-2 hover:bg-[#002256] hover:text-white cursor-pointer"
                  onMouseDown={() => {
                    handleChange(opt.name);
                    setFilter(opt.name);
                    setShowOptions(false);
                  }}
                >
                  {opt.label || opt.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Fallback para outros tipos
    return (
      <div>
        <input
          id={field.name}
          name={field.name}
          type={field.type}
          value={value || ""}
          placeholder={field.fieldPlaceholder}
          onChange={(e) => {
            const newValue = e.target.value;
            handleChange(newValue);
            // Limpa erro ao digitar
            if (patternError) {
              setPatternError("");
            }
          }}
          onBlur={(e) => {
            // Valida padrão quando perde o foco
            if (field.pattern && e.target.value) {
              validatePattern(e.target.value);
            } else {
              setPatternError("");
            }
          }}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
            error || patternError ? "border-red-500" : "border-gray-300"
          } bg-white`}
          required={field.required}
          readOnly={isFieldReadOnly}
        />
        {patternError && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{patternError}</p>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full sm:col-span-${field.fieldMaxSize || 1} relative mb-3 sm:mb-4`}
    >
      {field.label && field.label.trim() !== " " && (
        <label
          htmlFor={field.name}
          className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderField()}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <style jsx>{`
        .react-select-container {
          width: 100%;
        }
        .react-select__control {
          min-height: 42px;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
        }
        .react-select__control--is-focused {
          box-shadow: 0 0 0 2px #002256;
          border-color: #002256;
        }
        .react-select--error .react-select__control {
          border-color: #ef4444;
        }
        input[type='date'] { 
          color: #111827;
          position: relative;
        }
        input[type='date']::-webkit-datetime-edit-ampm-field,
        input[type='date']::-webkit-datetime-edit-day-field,
        input[type='date']::-webkit-datetime-edit-month-field,
        input[type='date']::-webkit-datetime-edit-year-field,
        input[type='date']::-webkit-datetime-edit { 
          color: #111827; 
        }
        input[type='date']::-webkit-datetime-edit-text { 
          color: #6b7280; 
        }
        input[type='date']::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 1;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23002B5B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
          width: 20px;
          height: 20px;
          padding: 0;
          margin-left: 8px;
        }
        input[type='date']::-webkit-calendar-picker-indicator:hover {
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23004B9B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }
        input[type='date']::-moz-calendar-picker-indicator {
          filter: invert(12%) sepia(85%) saturate(3026%) hue-rotate(201deg) brightness(89%) contrast(104%);
        }
      `}</style>
    </div>
  );
}

