/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchVehicleBrands } from "@/service/marcaService";
import { fetchVehicleModels } from "@/service/modeloService";
import Select from "react-select";
// import { useUserProfile } from "@/hooks/useUserProfile ";

const tipoUtilizadorOptions = [
  { value: "1", label: "Taxi" },
  { value: "10", label: "VeiculoLigeiroInstrucao" },
  { value: "16", label: "VeículoIndustrial" },
  { value: "17", label: "VeículoAgrícola" },
  { value: "18", label: "MáquinaAgrícola" },
  { value: "2", label: "AmbulanciaProntoSocorro" },
  { value: "23", label: "TransporteMercadorias" },
  { value: "30", label: "Transporte de passageiros em caixa de carga" },
  { value: "31", label: "Reboque de proprietário sem rebocador próprio" },
  { value: "32", label: "Veículos de abastecimento de água às populações" },
  { value: "33", label: "Bombeiros de instituição de utilidade pública" },
  {
    value: "34",
    label: "Veículo rebocador com seguro de reboque dispensado pelo proponente",
  },
  { value: "35", label: "Transporte coletivo de passageiros" },
  { value: "36", label: "VeiculoPesadoInstrucao" },
  { value: "37", label: "TaxiAluguer" },
  { value: "38", label: "TransporteMateriasPerigosas" },
  { value: "39", label: "MaquinaIndustrialRebocavel" },
  { value: "4", label: "Aluguer" },
  { value: "40", label: "TransporteMercadoriasAluguer" },
  { value: "41", label: "ReboqueCargaPassageiros" },
  { value: "42", label: "ReboqueCarga" },
  {
    value: "43",
    label: "Veículo de aluguer sem condutor passageiros ate 9 lugares",
  },
  {
    value: "44",
    label: "Veículo de aluguer sem condutor passageiros ou carga até 1600kg",
  },
  {
    value: "45",
    label:
      "Veículo de aluguer sem condutor passageiros ou carga 1601kg a 3500kg",
  },
  { value: "99", label: "Normal" },
];

const ilhaOptions = [
  { id: 1967, name: "Ilha Santo Antão", value: "1", rank: "1" },
  { id: 1968, name: "Ilha São Vicente", value: "2", rank: "2" },
  { id: 1969, name: "Ilha São Nicolau", value: "3", rank: "3" },
  { id: 1970, name: "Ilha do Sal", value: "4", rank: "4" },
  { id: 1971, name: "Ilha da Boa Vista", value: "5", rank: "5" },
  { id: 1972, name: "Ilha de Santiago", value: "6", rank: "6" },
  { id: 1973, name: "Ilha do Maio", value: "7", rank: "7" },
  { id: 1974, name: "Ilha do Fogo", value: "8", rank: "8" },
  { id: 1975, name: "Ilha Brava", value: "9", rank: "9" },
];
interface Option {
  id: number | string;
  name: string;
}

interface FormFieldData {
  name: string;
  label: string;
  sourceData: string;
  type:
    | "text"
    | "date"
    | "select"
    | "autocomplete"
    | "number"
    | "brand"
    | "model"
    | string;
  required?: boolean;
  fieldPlaceholder?: string;
  fieldSize?: number;
}

interface FormFieldProps {
  field: FormFieldData;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  options?: Option[];
}

// Estado global compartilhado
const globalState = {
  selectedBrand: {
    id: null as number | null,
    name: "" as string,
    options: [] as Option[],
  },
  modelOptions: [] as Option[],
  lastLoadedBrandId: null as number | null,
  listeners: new Set<() => void>(),
};

// Funções para gerenciar o estado global
const setGlobalBrandState = (brand: {
  id: number | null;
  name: string;
  options: Option[];
}) => {
  globalState.selectedBrand = brand;
  globalState.listeners.forEach((listener) => listener());
};

const setGlobalModelOptions = (models: Option[]) => {
  globalState.modelOptions = models;
  globalState.listeners.forEach((listener) => listener());
};

export default function FormField({
  field,
  value,
  onChange,
  error,
  options = [],
}: FormFieldProps) {

  const [filter, setFilter] = useState(value || "");
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado local das marcas
  const [marcaOptions, setMarcaOptions] = useState<Option[]>([]);
  const [loadingMarca, setLoadingMarca] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [errorMarca, setErrorMarca] = useState<string | null>(null);
  const [errorModel, setErrorModel] = useState<string | null>(null);
  // Estado local para o erro da data
  const [dateError, setDateError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [licenseDateError, setLicenseDateError] = useState("");
  // Estado local que sincroniza com o global
  const [localGlobalState, setLocalGlobalState] = useState(globalState);
  const [licenseDuration, setLicenseDuration] = useState<{
    years: number;
    months: number;
    days: number;
  } | null>(null); // Função para atualizar estado local
  const updateLocalState = useCallback(() => {
    setLocalGlobalState({ ...globalState });
  }, []);

  const subscribeToGlobalState = (callback: () => void): void => {
    globalState.listeners.add(callback);
    // Não retorna nada
  };

  const unsubscribeFromGlobalState = (callback: () => void): void => {
    globalState.listeners.delete(callback);
  };
  useEffect(() => {
    subscribeToGlobalState(updateLocalState);
    return () => {
      unsubscribeFromGlobalState(updateLocalState);
    };
  }, [updateLocalState]);

  // Atualiza filtro quando value muda
  useEffect(() => {
    setFilter(value || "");
  }, [value]);



  // Carrega marcas apenas uma vez quando o componente monta
  useEffect(() => {
    if (field.name === "brand" && marcaOptions.length === 0) {
      const loadBrands = async () => {
        setLoadingMarca(true);
        setErrorMarca(null);
        try {
          const brands = await fetchVehicleBrands();
          setMarcaOptions(brands);
          setGlobalBrandState({
            ...globalState.selectedBrand,
            options: brands,
          });
        } catch (err) {
          console.error("Erro ao buscar marcas:", err);
          setErrorMarca("Erro ao carregar marcas. Tente novamente mais tarde.");
        } finally {
          setLoadingMarca(false);
        }
      };
      loadBrands();
    }
  }, [field.name, marcaOptions.length]);

  // Sincroniza o estado da marca selecionada com o valor atual
  useEffect(() => {
    if (field.name === "brand") {
      if (value && marcaOptions.length > 0) {
        const marca = marcaOptions.find((m) => m.name === value);
        if (marca) {
          const brandId = Number(marca.id);
          setGlobalBrandState({
            id: brandId,
            name: marca.name,
            options: marcaOptions,
          });
        }
      } else if (!value) {
        setGlobalBrandState({
          id: null,
          name: "",
          options: marcaOptions,
        });
      }
    }
  }, [value, marcaOptions, field.name]);

  // Carrega modelos quando a marca muda e apenas para campos de modelo
  useEffect(() => {
    if (field.sourceData === "modelo") {
      // Se não há marca selecionada, limpa os modelos
      if (!localGlobalState.selectedBrand.id) {
        if (localGlobalState.modelOptions.length > 0) {
          setGlobalModelOptions([]);
        }
        return;
      }

      // Se a marca mudou, limpa o valor do modelo
      if (
        value &&
        globalState.lastLoadedBrandId !== localGlobalState.selectedBrand.id
      ) {
        onChange("");
      }

      if (
        !loadingModel &&
        (globalState.lastLoadedBrandId !== localGlobalState.selectedBrand.id ||
          localGlobalState.modelOptions.length === 0)
      ) {
        loadModels(localGlobalState.selectedBrand.id);
      }
    }
  }, [
    localGlobalState.selectedBrand.id,
    field.sourceData,
    loadingModel,
    value,
    onChange,
  ]);

  const loadModels = useCallback(
    async (brandId: number) => {
      if (
        loadingModel ||
        (globalState.lastLoadedBrandId === brandId &&
          localGlobalState.modelOptions.length > 0)
      ) {
        return;
      }

      setLoadingModel(true);
      setErrorModel(null);
      setGlobalModelOptions([]);
      globalState.lastLoadedBrandId = brandId;

      try {
        const models = await fetchVehicleModels(brandId);
        setGlobalModelOptions(models);
      } catch (err) {
        console.error("Erro ao buscar modelos:", err);
        setErrorModel("Erro ao carregar modelos. Tente novamente mais tarde.");
        globalState.lastLoadedBrandId = null;
      } finally {
        setLoadingModel(false);
      }
    },
    [loadingModel, localGlobalState.modelOptions.length]
  );

  // Handler para seleção de marca
  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue);
    setFilter(selectedValue);

    const selectedBrand = marcaOptions.find((m) => m.name === selectedValue);

    if (selectedBrand) {
      const brandId = Number(selectedBrand.id);
      setGlobalBrandState({
        id: brandId,
        name: selectedBrand.name,
        options: marcaOptions,
      });
    } else {
      setGlobalBrandState({
        id: null,
        name: "",
        options: marcaOptions,
      });
    }
  };

  const handleSelectOption = (name: string) => {
    onChange(name);
    setFilter(name);
    setShowOptions(false);
  };

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getModelFieldState = () => {
    if (loadingModel) {
      return {
        disabled: true,
        placeholder: `Carregando modelos para ${localGlobalState.selectedBrand.name}...`,
        showOptions: false,
      };
    }

    if (!localGlobalState.selectedBrand.id) {
      return {
        disabled: true,
        placeholder: "Selecione uma marca primeiro",
        showOptions: false,
      };
    }

    if (errorModel) {
      return {
        disabled: true,
        placeholder: "Erro ao carregar modelos",
        showOptions: false,
      };
    }

    if (localGlobalState.modelOptions.length === 0) {
      return {
        disabled: true,
        placeholder: `Nenhum modelo encontrado para ${localGlobalState.selectedBrand.name}`,
        showOptions: false,
      };
    }

    return {
      disabled: false,
      placeholder: field.fieldPlaceholder || "Selecione um modelo",
      showOptions: true,
    };
  };

  const modelFieldState = getModelFieldState();

  return (
    <div
      ref={containerRef}
      className={`w-full sm:col-span-${
        field.fieldSize || 1
      } relative mb-3 sm:mb-4`}
    >
      <label
        htmlFor={field.name}
        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.name === "licenseDate" ? (
        <div>
          <input
            id={field.name}
            name={field.name}
            type="date"
            value={value}
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm border rounded-lg text-gray-900 placeholder-gray-500 ${
              licenseDateError ? "border-red-500" : "border-gray-300"
            }`}
            onChange={(e) => {
              const selectedDate = e.target.value;
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Normaliza a data atual

              if (selectedDate) {
                const licenseDate = new Date(selectedDate);
                licenseDate.setHours(0, 0, 0, 0); // Normaliza a data selecionada

                // Validação principal: data não pode ser futura
                if (licenseDate > today) {
                  setLicenseDateError("A data da carta não pode ser futura");
                  onChange("");
                  return;
                }

                // Validação adicional: data mínima (exemplo: 1900)
                const minDate = new Date(1900, 0, 1);
                if (licenseDate < minDate) {
                  setLicenseDateError("Data inválida");
                  onChange("");
                  return;
                }

                setLicenseDateError("");
                onChange(selectedDate);

                // Cálculo do tempo com carta (opcional)
                const diffTime = Math.abs(
                  today.getTime() - licenseDate.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffYears = Math.floor(diffDays / 365);
                const remainingDays = diffDays % 365;
                const diffMonths = Math.floor(remainingDays / 30);
                const diffDaysFinal = remainingDays % 30;

                console.log(
                  `Tempo com carta: ${diffYears} anos, ${diffMonths} meses e ${diffDaysFinal} dias`
                );
              } else {
                onChange("");
              }
            }}
            required={field.required}
            max={new Date().toISOString().split("T")[0]} // Usa new Date() diretamente aqui
            min="1900-01-01" // Data mínima razoável
          />
          {licenseDateError && (
            <p className="text-red-500 text-sm mt-1">{licenseDateError}</p>
          )}
        </div>
      ) : field.name === "birthDate" ? (
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
                const birthDate = new Date(selectedDate);
                birthDate.setHours(0, 0, 0, 0);

                // Calcula a idade
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                if (
                  monthDiff < 0 ||
                  (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ) {
                  age--;
                }

                // Validação da idade mínima (18 anos)
                if (age < 18) {
                  setBirthDateError(
                    "É necessário ter pelo menos 18 anos de idade"
                  );
                  onChange("");
                  return;
                } else {
                  setBirthDateError("");
                }

                onChange(selectedDate);
              } else {
                onChange("");
              }
            }}
            className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
              birthDateError ? "border-red-500" : "border-gray-300"
            }`}
            required={field.required}
            max={
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString()
                .split("T")[0]
            }
          />
          {birthDateError && (
            <p className="text-red-500 text-sm mt-1">{birthDateError}</p>
          )}
        </div>
      ) : field.name === "driverLicenseDate" ? (
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
                const licenseDate = new Date(selectedDate);
                licenseDate.setHours(0, 0, 0, 0);

                // Validação da data
                if (licenseDate > today) {
                  setDateError(
                    "A data da carta de condução não pode ser futura"
                  );
                  onChange("");
                  setLicenseDuration(null);
                  return;
                } else {
                  setDateError("");
                }

                // Cálculo da diferença
                let years = today.getFullYear() - licenseDate.getFullYear();
                let months = today.getMonth() - licenseDate.getMonth();
                let days = today.getDate() - licenseDate.getDate();

                if (days < 0) {
                  months--;
                  const lastDayOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    0
                  ).getDate();
                  days += lastDayOfMonth;
                }

                if (months < 0) {
                  years--;
                  months += 12;
                }

                setLicenseDuration({ years, months, days });
                onChange(selectedDate);
              } else {
                setLicenseDuration(null);
                onChange("");
              }
            }}
            className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
              dateError ? "border-red-500" : "border-gray-300"
            }`}
            required={field.required}
            max={new Date().toISOString().split("T")[0]}
          />
          {licenseDuration && (
            <p className="text-sm text-gray-600 mt-1">
              Tem{" "}
              {licenseDuration.years > 0 &&
                `${licenseDuration.years} ano${
                  licenseDuration.years !== 1 ? "s" : ""
                }`}
              {licenseDuration.years > 0 && licenseDuration.months > 0 && ", "}
              {licenseDuration.months > 0 &&
                `${licenseDuration.months} mês${
                  licenseDuration.months !== 1 ? "es" : ""
                }`}
              {(licenseDuration.years > 0 || licenseDuration.months > 0) &&
                licenseDuration.days > 0 &&
                " e "}
              {licenseDuration.days > 0 &&
                `${licenseDuration.days} dia${
                  licenseDuration.days !== 1 ? "s" : ""
                }`}
              {" com carta de condução"}
            </p>
          )}
          {dateError && (
            <p className="text-red-500 text-sm mt-1">{dateError}</p>
          )}
        </div>
      ) : field.name === "brand" ? (
        loadingMarca ? (
          <div className="p-2 border rounded-md bg-blue-50 text-blue-600 border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Buscando marcas...
            </div>
          </div>
        ) : errorMarca ? (
          <div className="text-red-500 bg-red-50 p-2 border border-red-300 rounded-md">
            {errorMarca}
          </div>
        ) : (
          <Select
            id={field.name}
            name={field.name}
            value={value ? { value, label: value } : null}
            onChange={(selectedOption) => {
              const newValue = selectedOption ? selectedOption.value : "";
              onChange(newValue);
              setFilter(newValue);

              // Lógica adicional para marca, se necessário
              if (field.name === "brand") {
                const selectedBrand = marcaOptions.find(
                  (m) => m.name === newValue
                );
                if (selectedBrand) {
                  const brandId = Number(selectedBrand.id);
                  setGlobalBrandState({
                    id: brandId,
                    name: selectedBrand.name,
                    options: marcaOptions,
                  });
                }
              }
            }}
            options={marcaOptions.map((brand) => ({
              value: brand.name,
              label: brand.name,
            }))}
            className={`react-select-container text-gray-500 ${
              error ? "react-select--error" : ""
            }`}
            classNamePrefix="react-select"
            placeholder={field.fieldPlaceholder || "Selecione uma marca"}
            isClearable
            noOptionsMessage={({ inputValue }) =>
              inputValue.length < 3
                ? "Digite pelo menos 3 letras"
                : "Nenhuma marca encontrada"
            }
            loadingMessage={() => "Carregando..."}
            isLoading={loadingMarca}
            required={field.required}
          />
        )
      ) : field.sourceData === "modelo" ? (
        /* Campo de Modelo */
        loadingModel ? (
          <div className="p-2 border rounded-md bg-blue-50 text-blue-600 border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Buscando modelos...
            </div>
          </div>
        ) : errorModel ? (
          <div className="text-red-500 bg-red-50 p-2 border border-red-300 rounded-md">
            {errorModel}
            <button
              type="button"
              onClick={() =>
                localGlobalState.selectedBrand.id &&
                loadModels(localGlobalState.selectedBrand.id)
              }
              className="ml-2 text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
              error ? "border-red-500" : "border-gray-300"
            } bg-white`}
            required={field.required}
          >
            <option value="">{modelFieldState.placeholder}</option>
            {modelFieldState.showOptions &&
              localGlobalState.modelOptions.map((model) => (
                <option key={model.id} value={model.name}>
                  {model.name}
                </option>
              ))}
          </select>
        )
      ) : field.name === "TipoDeUtilizacao" ? (
        <Select
          id={field.name}
          name={field.name}
          value={
            tipoUtilizadorOptions.find((opt) => opt.value === value) || null
          }
          onChange={(selectedOption) => {
            const newValue = selectedOption ? selectedOption.value : "";
            onChange(newValue);
          }}
          options={tipoUtilizadorOptions}
          className={`react-select-container text-gray-500 ${
            error ? "react-select--error" : ""
          }`}
          classNamePrefix="react-select"
          placeholder={
            field.fieldPlaceholder || "Selecione o tipo de utilização"
          }
          isClearable
          noOptionsMessage={() => "Nenhuma opção disponível"}
          required={field.required}
        />
      ) : field.name === "Ilha" ? (
        <Select
          id={field.name}
          name={field.name}
          value={
            ilhaOptions.find((opt) => opt.value === value)
              ? {
                  value: value,
                  label: ilhaOptions.find((opt) => opt.value === value)?.name,
                }
              : null
          }
          onChange={(selectedOption) => {
            const newValue = selectedOption ? selectedOption.value : "";
            onChange(newValue);
          }}
          options={ilhaOptions.map((ilha) => ({
            value: ilha.value,
            label: ilha.name,
          }))}
          className={`react-select-container text-gray-500 ${
            error ? "react-select--error" : ""
          }`}
          classNamePrefix="react-select"
          placeholder={field.fieldPlaceholder || "Selecione a ilha"}
          isClearable
          noOptionsMessage={() => "Nenhuma opção disponível"}
          required={field.required}
        />
      ) : field.type === "select" ? (
        /* Select genérico */
        <select
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          required={field.required}
        >
          <option value="">
            {field.fieldPlaceholder || "Selecione uma opção"}
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.name}>
              {opt.name}
            </option>
          ))}
        </select>
      ) : field.type === "autocomplete" ? (
        /* Autocomplete */
        <div className="relative">
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={filter}
            placeholder={field.fieldPlaceholder || "Digite para buscar..."}
            onChange={(e) => {
              setFilter(e.target.value);
              onChange(e.target.value);
              setShowOptions(true);
            }}
            onFocus={() => setShowOptions(true)}
            onBlur={() => setTimeout(() => setShowOptions(false), 200)}
            autoComplete="off"
            className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            required={field.required}
          />
          {showOptions && filteredOptions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-md w-full max-h-40 overflow-auto mt-1 shadow-lg">
              {filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  className="px-4 py-2 hover:bg-[#002256] hover:text-white cursor-pointer"
                  onMouseDown={() => handleSelectOption(opt.name)}
                >
                  {opt.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* Input padrão */
        <input
          id={field.name}
          name={field.name}
          type={field.type || "text"}
          value={value}
          placeholder={field.fieldPlaceholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-2 border rounded-md text-gray-900 placeholder-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          } bg-white`}
          required={field.required}
        />
      )}
      {/* Mensagem de erro */}
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
        /* Date input readability */
        input[type='date'] { color: #111827; }
        input[type='date']::-webkit-datetime-edit-ampm-field,
        input[type='date']::-webkit-datetime-edit-day-field,
        input[type='date']::-webkit-datetime-edit-month-field,
        input[type='date']::-webkit-datetime-edit-year-field,
        input[type='date']::-webkit-datetime-edit { color: #111827; }
        input[type='date']::-webkit-datetime-edit-text { color: #6b7280; }
        input[type='date']::-webkit-calendar-picker-indicator { filter: invert(20%); }
      `}</style>
    </div>
  );
}
