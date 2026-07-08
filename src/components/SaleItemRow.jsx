import React from 'react';

const SaleItemRow = ({ item, onUpdate, onRemove }) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] mb-3">
      <div className="flex justify-between items-start mb-3">
        <input 
          className="font-bold text-[#0F172A] outline-none w-2/3 bg-transparent"
          placeholder="Product Name"
          value={item.name}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
        />
        <button onClick={onRemove} className="text-red-400 text-xs font-bold uppercase">Remove</button>
      </div>
      
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <p className="text-[10px] text-[#94A3B8] font-bold mb-1 uppercase tracking-tight">Qty</p>
          <input 
            type="number"
            className="w-full bg-[#F1F5F9] rounded-lg p-2 text-sm font-bold outline-none border border-transparent focus:border-[#2F5FB3]"
            value={item.qty}
            onChange={(e) => onUpdate({ ...item, qty: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-[#94A3B8] font-bold mb-1 uppercase tracking-tight">Price</p>
          <input 
            type="number"
            className="w-full bg-[#F1F5F9] rounded-lg p-2 text-sm font-bold outline-none border border-transparent focus:border-[#2F5FB3]"
            placeholder="0"
            value={item.price}
            onChange={(e) => onUpdate({ ...item, price: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex-[1.5] text-right">
          <p className="text-[10px] text-[#94A3B8] font-bold mb-1 uppercase tracking-tight">Subtotal</p>
          <div className="bg-[#DCFCE7] text-[#15803D] font-black py-2 px-3 rounded-lg text-sm">
            ₦{(item.qty * item.price).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleItemRow;