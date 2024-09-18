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

func (c *Command) CommandPath() string {
	return c.cmd.CommandPath()
}

func NewCommand(cmd *cobra.Command) *Command {
	return &Command{cmd: cmd}
}
