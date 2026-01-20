/**
 * Error Modal Component
 * Displays error messages in a clean modal dialog instead of browser alerts
 */

"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  subtitle?: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = "Upload Failed",
  message,
  subtitle,
}: ErrorModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>

                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-poppins font-semibold text-gray-900 text-center mb-2"
                >
                  {title}
                </Dialog.Title>

                {/* Message */}
                <div className="text-center">
                  <p className="text-sm font-poppins text-gray-700 mb-1">
                    {message}
                  </p>
                  {subtitle && (
                    <p className="text-xs font-poppins text-gray-500 mt-2">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-poppins font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Got it
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
