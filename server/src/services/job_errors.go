package services

import "errors"

type RetryableError interface {
	error
	Retryable() bool
}

type jobError struct {
	err       error
	retryable bool
}

func (e *jobError) Error() string { return e.err.Error() }
func (e *jobError) Unwrap() error { return e.err }
func (e *jobError) Retryable() bool {
	return e.retryable
}

func Retryable(err error) error {
	if err == nil {
		return nil
	}
	return &jobError{err: err, retryable: true}
}

func Permanent(err error) error {
	if err == nil {
		return nil
	}
	return &jobError{err: err, retryable: false}
}

func IsRetryableError(err error) bool {
	var target RetryableError
	if errors.As(err, &target) {
		return target.Retryable()
	}
	return false
}
