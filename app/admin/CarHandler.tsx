"use client";

import { useState } from "react";
import type { Car } from "@/lib/types";
import { editCars } from "@/lib/api/car";

interface Props {
  initialCars: Car[];
}

export default function CarTab({ initialCars }: Props) {
  const [cars, setCars] = useState(initialCars);

  const [editingCarId, setEditingCarId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Car>>({});

  function startEdit(car: Car) {
    setEditingCarId(car.car_id);
    setEditData(car);
  }

  function handleChange(field: keyof Car, value: any) {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleUpdate() {
    if (!editingCarId) return;

    const updated = await editCars(editingCarId, editData);

    setCars((prev) =>
      prev.map((c) => (c.car_id === editingCarId ? updated : c))
    );

    setEditingCarId(null);
    setEditData({});
  }

  return (
    <div className="text-white p-4">
      <h1 className="text-2xl mb-4">Admin Dashboard</h1>

      {cars.map((car) => (
        <div key={car.car_id} className="border p-3 mb-3">
          <div>
            {car.make} {car.model}
          </div>

          <div>${car.price}</div>

          {editingCarId === car.car_id ? (
            <div className="mt-2 space-y-2">
              <input
              
                value={editData.price ?? ""}
                onChange={(e) =>
                  handleChange("price", Number(e.target.value))
                }
                className="text-black bg-white"
                placeholder="Price"
              />

              <input
                value={editData.status ?? ""}
                onChange={(e) =>
                  handleChange("status", e.target.value)
                }
                className="text-black bg-white"
                placeholder="Status"
              />

              <div className="space-x-2">
                <button
                  onClick={handleUpdate}
                  className="bg-green-600 px-2 py-1"
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setEditingCarId(null);
                    setEditData({});
                  }}
                  className="bg-red-600 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => startEdit(car)}
              className="bg-blue-600 px-2 py-1 mt-2"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}