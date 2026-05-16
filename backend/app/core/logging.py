import io
import logging
import sys

import structlog


class _SafeFileLogger:
    """
    A drop-in PrintLogger replacement that swallows OSError/ValueError.
    On Windows + uvicorn --reload, sys.stdout can become an invalid file
    descriptor, causing OSError on every write. This logger silently
    discards messages when the underlying stream is broken.
    """

    def __init__(self, file: io.TextIOWrapper | None = None):
        self._file = file or sys.stdout

    def _safe_write(self, message: str) -> None:
        try:
            print(message, file=self._file, flush=True)
        except (OSError, ValueError):
            pass

    # structlog expects these methods
    msg = _safe_write
    err = _safe_write
    debug = _safe_write
    info = _safe_write
    warning = _safe_write
    error = _safe_write
    critical = _safe_write
    fatal = _safe_write
    exception = _safe_write


class _SafeLoggerFactory:
    """Factory that produces _SafeFileLogger instances."""

    def __init__(self, file: io.TextIOWrapper | None = None):
        self._file = file

    def __call__(self, *args, **kwargs) -> _SafeFileLogger:
        return _SafeFileLogger(file=self._file)


def configure_logging() -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.add_log_level,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=_SafeLoggerFactory(),
        cache_logger_on_first_use=True,
    )
