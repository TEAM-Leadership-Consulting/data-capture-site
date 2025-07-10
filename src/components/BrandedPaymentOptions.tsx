import React from 'react';
import { CreditCard, DollarSign, Smartphone, Mail } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ClaimFormData } from '../lib/schemas';

interface BrandedPaymentOptionsProps {
  register: UseFormRegister<ClaimFormData>;
  watchedValues: Partial<ClaimFormData>;
  errors: FieldErrors<ClaimFormData>;
}

const BrandedPaymentOptions = ({ register, watchedValues, errors }: BrandedPaymentOptionsProps) => {

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
        Section III: Payment Method
      </h2>
      <p className="text-sm text-gray-600 mb-4 sm:mb-6">
        Please select how you would like to receive your settlement payment:
      </p>

      <div className="space-y-3 sm:space-y-4">
        {/* PayPal Option */}
        <label className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          watchedValues.paymentMethod === 'paypal' 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
        }`}>
          <input
            type="radio"
            value="paypal"
            {...register('paymentMethod')}
            className="mt-1 w-5 h-5 flex-shrink-0 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
            style={{
              accentColor: '#2563eb'
            }}
          />
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-base sm:text-lg block">PayPal</span>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Fast, secure digital payments worldwide</p>
            {watchedValues.paymentMethod === 'paypal' && (
              <div className="mt-3 bg-white p-3 border border-blue-200 rounded-md">
                <input
                  type="email"
                  placeholder="PayPal email address"
                  {...register('paypalEmail')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </label>

        {/* Venmo Option */}
        <label className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          watchedValues.paymentMethod === 'venmo' 
            ? 'border-blue-400 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
        }`}>
          <input
            type="radio"
            value="venmo"
            {...register('paymentMethod')}
            className="mt-1 w-5 h-5 flex-shrink-0 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600"
            style={{
              accentColor: '#2563eb'
            }}
          />
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-base sm:text-lg block">Venmo</span>
                <div className="text-xs text-blue-600 font-medium">MOBILE PAYMENTS</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Quick mobile payments with friends and family</p>
            {watchedValues.paymentMethod === 'venmo' && (
              <div className="mt-3 bg-white p-3 border border-blue-200 rounded-md">
                <input
                  type="tel"
                  placeholder="Venmo phone number"
                  {...register('venmoPhone')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </label>

        {/* Zelle Option */}
        <label className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          watchedValues.paymentMethod === 'zelle' 
            ? 'border-purple-500 bg-purple-50 shadow-md' 
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
        }`}>
          <input
            type="radio"
            value="zelle"
            {...register('paymentMethod')}
            className="mt-1 w-5 h-5 flex-shrink-0 text-purple-600 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 checked:bg-purple-600 checked:border-purple-600"
            style={{
              accentColor: '#9333ea'
            }}
          />
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-base sm:text-lg block">Zelle</span>
                <div className="text-xs text-purple-600 font-medium">BANK TO BANK</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Direct bank-to-bank transfers in minutes</p>
            {watchedValues.paymentMethod === 'zelle' && (
              <div className="mt-3 bg-white p-3 border border-purple-200 rounded-md space-y-3">
                <input
                  type="tel"
                  placeholder="Zelle phone number"
                  {...register('zellePhone')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-center text-sm text-gray-500 font-medium">OR</div>
                <input
                  type="email"
                  placeholder="Zelle email address"
                  {...register('zelleEmail')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </label>

        {/* Prepaid Card Option */}
        <label className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          watchedValues.paymentMethod === 'prepaidCard' 
            ? 'border-green-500 bg-green-50 shadow-md' 
            : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
        }`}>
          <input
            type="radio"
            value="prepaidCard"
            {...register('paymentMethod')}
            className="mt-1 w-5 h-5 flex-shrink-0 text-green-600 border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 checked:bg-green-600 checked:border-green-600"
            style={{
              accentColor: '#059669'
            }}
          />
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-base sm:text-lg block">Prepaid Card</span>
                <div className="text-xs text-green-600 font-medium">PHYSICAL CARD</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Receive a prepaid debit card by mail</p>
            {watchedValues.paymentMethod === 'prepaidCard' && (
              <div className="mt-3 bg-white p-3 border border-green-200 rounded-md">
                <input
                  type="email"
                  placeholder="Email for card delivery notifications"
                  {...register('prepaidCardEmail')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </label>

        {/* Physical Check Option */}
        <label className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          watchedValues.paymentMethod === 'physicalCheck' 
            ? 'border-gray-600 bg-gray-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-25'
        }`}>
          <input
            type="radio"
            value="physicalCheck"
            {...register('paymentMethod')}
            className="mt-1 w-5 h-5 flex-shrink-0 text-gray-600 border-2 border-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 checked:bg-gray-600 checked:border-gray-600"
            style={{
              accentColor: '#4b5563'
            }}
          />
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-base sm:text-lg block">Physical Check</span>
                <div className="text-xs text-gray-600 font-medium">TRADITIONAL MAIL</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Receive a paper check by mail to your address above</p>
          </div>
        </label>
      </div>

      {/* Payment Method Validation Message */}
      {errors.paymentMethod && (
        <p className="text-red-600 text-sm mt-4">{errors.paymentMethod.message}</p>
      )}

      {/* Additional Info Section */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <DollarSign className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Payment Processing Information</h3>
            <p className="text-xs sm:text-sm text-blue-800">
              Settlement payments will be processed within 60-90 days after the final approval. 
              Digital payments (PayPal, Venmo, Zelle) typically arrive faster than physical methods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandedPaymentOptions;