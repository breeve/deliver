package command

import (
	"github.com/spf13/cobra"
)

type Command struct {
	cmd *cobra.Command
}

func (c *Command) Execute(argOrigin string) (stdOut string, stdErr string, err error) {
	return "", "", nil
}

func NewCommand() *Command {
	return &Command{cmd: nil}
}
