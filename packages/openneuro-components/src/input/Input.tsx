import React from 'react'
import './input.scss'

export interface InputProps {
  placeholder: string
  type: string
  disabled: boolean
  label?: string
  name: string
  labelStyle?: 'inline' | 'float' | 'default'
  value: string
  setValue: string
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  type,
  label,
  name,
  labelStyle,
  setValue,
}) => {
  return (
    <>
      {labelStyle == 'float' ? (
        <div className="form-control float-form-style">
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            onChange={e => setValue(e.target.value)}
          />
          {label ? <label htmlFor={name}>{label}</label> : null}
        </div>
      ) : labelStyle == 'inline' ? (
        <div className="form-control inline">
          {label ? <label htmlFor={name}>{label}</label> : null}
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            onChange={e => setValue(e.target.value)}
          />
        </div>
      ) : (
        <div className="form-control ">
          {label ? <label htmlFor={name}>{label}</label> : null}
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            onChange={e => setValue(e.target.value)}
          />
        </div>
      )}
    </>
  )
}
