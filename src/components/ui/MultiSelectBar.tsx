import React, { useMemo } from "react";
import Select, { components } from "react-select";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
    value: string;
    label: string;
    imageUrl: string;
}

interface MultiSelectBarProps {
    options: Option[];
    selected: Option[];
    onChange: (selected: Option[]) => void;
}

const CustomOption = React.memo((props: any) => (
    <components.Option {...props}>
        <div className="flex items-center">
            <img
                src={props.data.imageUrl}
                alt=""
                className="w-6 h-6 rounded-full mr-2"
            />
            <span>{props.label}</span>
        </div>
    </components.Option>
));

export default function MultiSelectBar({
    options,
    selected,
    onChange,
}: MultiSelectBarProps) {
    // Memoize heavy lists
    const memoOptions = useMemo(() => options, [options]);

    return (
        <div className="w-full mb-6 relative z-50">
            <Select
                isMulti
                value={selected}
                onChange={(val) => onChange(val as Option[])}
                options={memoOptions}
                placeholder="Search profiles..."
                classNamePrefix="select"
                components={{ Option: CustomOption }}
                classNames={{
                    control: () =>
                        "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition",
                    menu: () =>
                        "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md overflow-hidden z-50",
                    option: (state) =>
                        `flex items-center px-2 py-1.5 text-sm ${state.isFocused
                            ? "bg-gray-200 dark:bg-gray-700"
                            : ""
                        }`,
                }}
                styles={{
                    multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#374151",
                        color: "white",
                        borderRadius: "8px",
                        padding: "0 4px",
                    }),
                    multiValueLabel: (base) => ({
                        ...base,
                        color: "white",
                    }),
                    input: (base) => ({
                        ...base,
                        color: "inherit",
                    }),
                }}
                menuPlacement="auto"
                maxMenuHeight={240}
            />

            <AnimatePresence>
                {selected.length > 0 && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4 flex flex-wrap gap-2"
                    >
                        {selected.map((profile) => (
                            <motion.div
                                key={profile.value}
                                layout
                                className="flex items-center bg-gray-200 dark:bg-gray-700 p-2 rounded-lg shadow-sm"
                                whileHover={{ scale: 1.05 }}
                            >
                                <img
                                    src={profile.imageUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-full mr-2"
                                />
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {profile.label}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}